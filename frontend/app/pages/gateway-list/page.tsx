"use client";

import { useEffect, useState, useRef } from "react";
import { streamGatewayFrames } from "@/lib/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Radio, Play, Square, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Gateway Frame type
type GatewayFrame = {
  frameType?: string;
  phy_payload?: any;
  tx_info?: any;
  rx_info?: any;
  error?: string;
  timestamp?: number;
};

export default function GatewayListPage() {
  const [frames, setFrames] = useState<GatewayFrame[]>([]);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [manualGatewayEui, setManualGatewayEui] = useState<string>("");

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Function to call every 10 seconds while streaming
  function periodicFunction() {
    // Add your periodic logic here
    console.log("Periodic function called - streaming is active");
    // You can add any logic you need here, such as:
    // - Status checks
    // - Data refresh
    // - Logging
  }

  function startStreaming() {
    if (!manualGatewayEui) {
      setError("Please enter a Gateway EUI");
      return;
    }

    // Clear previous frames
    setFrames([]);
    setError(null);
    setStreaming(true);

    // Cleanup previous stream if exists
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up interval to call function every 10 seconds
    intervalRef.current = setInterval(() => {
      periodicFunction();
    }, 10000);

    // Start streaming
    streamGatewayFrames(
      manualGatewayEui,
      (frame) => {
        // Add timestamp to frame
        const frameWithTimestamp: GatewayFrame = {
          ...frame,
          timestamp: Date.now(),
        };
        setFrames((prev) => [frameWithTimestamp, ...prev]);
      },
      (error) => {
        setError(`Stream error: ${error.message}`);
        setStreaming(false);
        // Clear interval on error
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    )
      .then((cleanup) => {
        cleanupRef.current = cleanup;
      })
      .catch((err) => {
        setError(`Failed to start stream: ${err.message}`);
        setStreaming(false);
        // Clear interval on error
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });
  }

  function stopStreaming() {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    // Clear interval when stopping
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStreaming(false);
  }

  function clearFrames() {
    setFrames([]);
  }

  function formatTimestamp(timestamp?: number): string {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString();
  }

  function formatFrameData(data: any): string {
    if (!data) return "N/A";
    if (typeof data === "string") return data;
    return JSON.stringify(data, null, 2);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gateway Frames Stream
            </h1>
            <p className="text-muted-foreground">
              Stream and view LoRaWAN frames from gateways in real-time
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gateway Selection</CardTitle>
            <CardDescription>
              Enter a Gateway EUI to start streaming frames
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-eui">Gateway EUI</Label>
                <Input
                  id="manual-eui"
                  placeholder="e.g., ac1f09fffe051cca"
                  value={manualGatewayEui}
                  onChange={(e) => setManualGatewayEui(e.target.value)}
                  disabled={streaming}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={startStreaming}
                  disabled={streaming || !manualGatewayEui}
                >
                  {streaming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Streaming...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Stream
                    </>
                  )}
                </Button>
                <Button
                  onClick={stopStreaming}
                  variant="outline"
                  disabled={!streaming}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Stream
                </Button>
                <Button
                  onClick={clearFrames}
                  variant="outline"
                  disabled={frames.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Frames
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Gateway Frames</CardTitle>
            <CardDescription>
              {frames.length} frame{frames.length !== 1 ? "s" : ""} received
              {streaming && " (streaming...)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {frames.length === 0 && !streaming ? (
              <div className="py-8 text-center text-muted-foreground">
                No frames received. Start streaming to see frames.
              </div>
            ) : frames.length === 0 && streaming ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {frames.map((frame, index) => (
                  <AccordionItem key={index} value={`frame-${index}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-4 flex-1">
                        <Badge
                          variant={
                            frame.frameType === "error"
                              ? "destructive"
                              : frame.frameType === "uplink"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {frame.frameType || "unknown"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(frame.timestamp)}
                        </span>
                        {frame.error && (
                          <span className="text-sm text-destructive">
                            Error: {frame.error}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {frame.error ? (
                          <Alert variant="destructive">
                            <AlertDescription>{frame.error}</AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            {frame.phy_payload && (
                              <div>
                                <Label className="mb-2 block font-semibold">
                                  PHY Payload
                                </Label>
                                <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-96">
                                  {formatFrameData(frame.phy_payload)}
                                </pre>
                              </div>
                            )}
                            {frame.tx_info && (
                              <div>
                                <Label className="mb-2 block font-semibold">
                                  TX Info
                                </Label>
                                <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-96">
                                  {formatFrameData(frame.tx_info)}
                                </pre>
                              </div>
                            )}
                            {frame.rx_info && (
                              <div>
                                <Label className="mb-2 block font-semibold">
                                  RX Info
                                </Label>
                                <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-96">
                                  {formatFrameData(frame.rx_info)}
                                </pre>
                              </div>
                            )}
                            {!frame.phy_payload &&
                              !frame.tx_info &&
                              !frame.rx_info && (
                                <div className="text-muted-foreground">
                                  No frame data available
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
