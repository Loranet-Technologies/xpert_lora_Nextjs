"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { streamGatewayFrames } from "@/lib/api/streams/streams";
import { getERPNextGateway } from "@/lib/api/gateway/gateway";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
import { Loader2, Radio } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Gateway Frame type
type GatewayFrame = {
  frameType?: string;
  phy_payload?: any;
  tx_info?: any;
  rx_info?: any;
  error?: string;
  timestamp?: number;
};

// Gateway type
type Gateway = {
  name: string;
  gateway_name: string;
  gateway_id_mac?: string;
  chirpstack_id?: string;
  tenant?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  altitude_meters?: number;
  network_server_id?: string;
  stats_interval_seconds?: number;
  status?: string;
  last_seen?: string;
  creation?: string;
  modified?: string;
} & Record<string, any>;

export default function GatewayFrames() {
  const params = useParams();
  const router = useRouter();
  const gatewayId = params?.id as string;

  // Frame streaming state
  const [frames, setFrames] = useState<GatewayFrame[]>([]);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [loadingGateway, setLoadingGateway] = useState<boolean>(false);

  // Start streaming automatically
  function startStreaming(gatewayEui: string) {
    // Clear previous frames
    setFrames([]);
    setError(null);
    setStreaming(true);

    // Cleanup previous stream if exists
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Start streaming
    streamGatewayFrames(
      gatewayEui,
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
      }
    )
      .then((cleanup) => {
        cleanupRef.current = cleanup;
      })
      .catch((err) => {
        setError(`Failed to start stream: ${err.message}`);
        setStreaming(false);
      });
  }

  // Load gateway details and auto-start streaming
  async function loadGateway() {
    if (!gatewayId) return;

    setLoadingGateway(true);
    setError(null);
    try {
      const gatewayData = await getERPNextGateway(gatewayId);
      setGateway(gatewayData as Gateway);

      // Use gateway_id_mac or chirpstack_id for streaming
      const gatewayEui =
        (gatewayData as Gateway).gateway_id_mac ||
        (gatewayData as Gateway).chirpstack_id;
      if (!gatewayEui) {
        setError("Gateway EUI not found. Cannot stream frames.");
      } else {
        // Automatically start streaming when gateway is loaded
        startStreaming(gatewayEui);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load gateway details");
    } finally {
      setLoadingGateway(false);
    }
  }

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Load gateway on mount
  useEffect(() => {
    if (gatewayId) {
      loadGateway();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatewayId]);

  function formatTimestamp(timestamp?: number): string {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString();
  }

  function formatFrameData(data: any): string {
    if (!data) return "N/A";
    if (typeof data === "string") return data;
    return JSON.stringify(data, null, 2);
  }

  const gatewayEui = gateway?.gateway_id_mac || gateway?.chirpstack_id;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/pages/gateway-list">
                    Gateway List
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {gateway?.gateway_name || gateway?.name || gatewayId}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radio className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {gateway?.gateway_name || gateway?.name || "Gateway"} Frames
                </h1>
                <p className="text-muted-foreground">
                  Stream and view gateway frames in real-time
                </p>
              </div>
            </div>

            {loadingGateway ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2 text-muted-foreground">Loading gateway...</p>
              </div>
            ) : gateway ? (
              <>
                {/* Gateway Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gateway Information</CardTitle>
                    <CardDescription>
                      {gateway.gateway_name || gateway.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Gateway EUI
                        </Label>
                        <p className="font-mono">{gatewayEui || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Status
                        </Label>
                        <div className="mt-1">
                          <Badge
                            variant={
                              gateway.status === "Active"
                                ? "default"
                                : gateway.status === "Disabled"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {gateway.status || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gateway Frames Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gateway Frames</CardTitle>
                    <CardDescription>
                      {frames.length} frame{frames.length !== 1 ? "s" : ""}{" "}
                      received
                      {streaming && " (streaming...)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {frames.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        {streaming
                          ? "Waiting for frames..."
                          : "No frames received yet."}
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
                                    <AlertDescription>
                                      {frame.error}
                                    </AlertDescription>
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
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Gateway not found</p>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
