"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { streamDeviceEvents, getERPNextDevice } from "@/lib/api/api";
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
import { Loader2, Smartphone } from "lucide-react";
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

// Device Event type
type DeviceEvent = {
  frameType?: string;
  result?: any;
  error?: string;
  timestamp?: number;
} & Record<string, any>;

// Device type
type Device = {
  name: string;
  device_name: string;
  dev_eui?: string;
  chirpstack_id?: string;
  application?: string;
  device_profile?: string;
  status?: string;
  description?: string;
  creation?: string;
  modified?: string;
} & Record<string, any>;

export default function DeviceEventsPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params?.id as string;

  // Event streaming state
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [loadingDevice, setLoadingDevice] = useState<boolean>(false);

  // Start streaming automatically
  function startStreaming(deviceEui: string) {
    // Clear previous events
    setEvents([]);
    setError(null);
    setStreaming(true);

    // Cleanup previous stream if exists
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Start streaming
    streamDeviceEvents(
      deviceEui,
      (event) => {
        // Add timestamp to event
        const eventWithTimestamp: DeviceEvent = {
          ...event,
          timestamp: Date.now(),
        };
        setEvents((prev) => [eventWithTimestamp, ...prev]);
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

  // Load device details and auto-start streaming
  async function loadDevice() {
    if (!deviceId) return;

    setLoadingDevice(true);
    setError(null);
    try {
      const deviceData = await getERPNextDevice(deviceId);
      setDevice(deviceData as Device);

      // Use dev_eui or chirpstack_id for streaming
      const deviceEui =
        (deviceData as Device).dev_eui || (deviceData as Device).chirpstack_id;
      if (!deviceEui) {
        setError("Device EUI not found. Cannot stream events.");
      } else {
        // Automatically start streaming when device is loaded
        startStreaming(deviceEui);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load device details");
    } finally {
      setLoadingDevice(false);
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

  // Load device on mount
  useEffect(() => {
    if (deviceId) {
      loadDevice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  function formatTimestamp(timestamp?: number): string {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString();
  }

  function formatEventData(data: any): string {
    if (!data) return "N/A";
    if (typeof data === "string") return data;
    return JSON.stringify(data, null, 2);
  }

  const deviceEui = device?.dev_eui || device?.chirpstack_id;

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
                  <BreadcrumbLink href="/pages/device-list">
                    Device List
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {device?.device_name || device?.name || deviceId}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {device?.device_name || device?.name || "Device"} Events
                </h1>
                <p className="text-muted-foreground">
                  Stream and view device events in real-time
                </p>
              </div>
            </div>

            {loadingDevice ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2 text-muted-foreground">Loading device...</p>
              </div>
            ) : device ? (
              <>
                {/* Device Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Device Information</CardTitle>
                    <CardDescription>
                      {device.device_name || device.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Device EUI
                        </Label>
                        <p className="font-mono">{deviceEui || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Status
                        </Label>
                        <div className="mt-1">
                          <Badge
                            variant={
                              device.status === "Active"
                                ? "default"
                                : device.status === "Disabled"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {device.status || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                      {device.application && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Application
                          </Label>
                          <p>{device.application}</p>
                        </div>
                      )}
                      {device.device_profile && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Device Profile
                          </Label>
                          <p>{device.device_profile}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Device Events Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Device Events</CardTitle>
                    <CardDescription>
                      {events.length} event{events.length !== 1 ? "s" : ""}{" "}
                      received
                      {streaming && " (streaming...)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {events.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        {streaming
                          ? "Waiting for events..."
                          : "No events received yet."}
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {events.map((event, index) => (
                          <AccordionItem key={index} value={`event-${index}`}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-4 flex-1">
                                <Badge
                                  variant={
                                    event.frameType === "error" || event.error
                                      ? "destructive"
                                      : event.frameType === "uplink"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {event.frameType || "event"}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatTimestamp(event.timestamp)}
                                </span>
                                {event.error && (
                                  <span className="text-sm text-destructive">
                                    Error: {event.error}
                                  </span>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                {event.error ? (
                                  <Alert variant="destructive">
                                    <AlertDescription>
                                      {event.error}
                                    </AlertDescription>
                                  </Alert>
                                ) : (
                                  <>
                                    {event.result && (
                                      <div>
                                        <Label className="mb-2 block font-semibold">
                                          Event Data
                                        </Label>
                                        <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-96">
                                          {formatEventData(event.result)}
                                        </pre>
                                      </div>
                                    )}
                                    {!event.result && (
                                      <div>
                                        <Label className="mb-2 block font-semibold">
                                          Full Event
                                        </Label>
                                        <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-96">
                                          {formatEventData(event)}
                                        </pre>
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
                  <p className="text-muted-foreground">Device not found</p>
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
