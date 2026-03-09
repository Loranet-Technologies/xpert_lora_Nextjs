"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  listERPNextGateways,
  syncERPNextGateways,
} from "@/lib/api/gateway/gateway";
import { fetchERPNextTenants } from "@/lib/api/tenant/tenant";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radio, RefreshCw, MapPin, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GatewayMap = dynamic(
  () => import("@/components/ui/gateway-map").then((mod) => mod.GatewayMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
  },
);

type Gateway = {
  name: string;
  gateway_name: string;
  gateway_id_mac?: string;
  chirpstack_id?: string;
  tenant?: string;
  description?: string;
  location?: string;
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

type Tenant = {
  name: string;
  tenant_name: string;
  chirpstack_id?: string;
} & Record<string, any>;

function formatCoordinates(lat?: number, lon?: number): string {
  if (lat === undefined || lon === undefined || lat === 0 || lon === 0) {
    return "—";
  }
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

/** Extract latitude/longitude from gateway - supports top-level fields or location JSON string */
function getGatewayCoords(g: Gateway): { lat: number; lng: number } | null {
  if (
    g.latitude != null &&
    g.longitude != null &&
    (g.latitude !== 0 || g.longitude !== 0)
  ) {
    return { lat: g.latitude, lng: g.longitude };
  }
  if (typeof g.location === "string") {
    try {
      const loc = JSON.parse(g.location) as {
        latitude?: number;
        longitude?: number;
      };
      if (loc?.latitude != null && loc?.longitude != null) {
        return { lat: loc.latitude, lng: loc.longitude };
      }
    } catch {
      /* ignore parse error */
    }
  }
  return null;
}

export default function GatewaysPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [loadingGateways, setLoadingGateways] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [totalGateways, setTotalGateways] = useState<number>(0);
  const [limit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);

  async function loadTenants() {
    try {
      const res = await fetchERPNextTenants({ fields: ["*"] });
      const data = (res as any).data || [];
      setTenants(data as Tenant[]);
    } catch (e: any) {
      console.error("Failed to load tenants:", e);
    }
  }

  async function loadGateways() {
    setLoadingGateways(true);
    setError(null);
    try {
      const filters: any = {};
      if (selectedTenant && selectedTenant !== "all") {
        filters.tenant = selectedTenant;
      }

      const res = await listERPNextGateways({
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        limit,
        offset,
      });

      const data = res.data || [];
      const total = res.total || 0;
      setGateways(data as Gateway[]);
      setTotalGateways(total);
    } catch (e: any) {
      setError(e?.message || "Failed to load gateways");
    } finally {
      setLoadingGateways(false);
    }
  }

  async function syncGateways() {
    if (!selectedTenant || selectedTenant === "all") {
      setError("Please select a tenant first");
      return;
    }

    setSyncing(true);
    setError(null);
    try {
      const result = await syncERPNextGateways(selectedTenant);
      if (result.success) {
        await loadGateways();
        setError(null);
      } else {
        setError(result.message || "Sync completed with warnings");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to sync gateways");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    loadGateways();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant, offset]);

  // Gateways with valid coordinates for the map (from latitude/longitude or location JSON)
  const gatewaysWithLocation = useMemo(() => {
    return gateways
      .map((g) => ({ gateway: g, coords: getGatewayCoords(g) }))
      .filter(
        (x): x is { gateway: Gateway; coords: { lat: number; lng: number } } =>
          x.coords != null,
      );
  }, [gateways]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radio className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gateways</h1>
                <p className="text-muted-foreground">
                  Manage, view, and map gateways from ChirpStack & ERPNext
                </p>
              </div>
            </div>

            <Tabs defaultValue="map" className="w-full">
              <TabsList className="grid w-full max-w-[280px] grid-cols-2">
                <TabsTrigger value="map" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Map
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  Gateway List
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Gateway Locations
                        </CardTitle>
                        <CardDescription>
                          {gatewaysWithLocation.length} gateway
                          {gatewaysWithLocation.length !== 1 ? "s" : ""} with
                          coordinates on map
                          {gateways.length > gatewaysWithLocation.length &&
                            ` (${gateways.length - gatewaysWithLocation.length} without location)`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full rounded-lg overflow-hidden border bg-muted">
                      <GatewayMap
                        gatewaysWithLocation={gatewaysWithLocation}
                        onViewFrames={(name) =>
                          router.push(`/pages/gateways/${name}`)
                        }
                        className="h-full w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Gateway List</CardTitle>
                        <CardDescription>
                          {totalGateways} gateway
                          {totalGateways !== 1 ? "s" : ""} found
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={selectedTenant}
                          onValueChange={(value) => {
                            setSelectedTenant(value);
                            setOffset(0);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Tenants</SelectItem>
                            {tenants.map((tenant) => (
                              <SelectItem key={tenant.name} value={tenant.name}>
                                {tenant.tenant_name || tenant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={syncGateways}
                          disabled={syncing || selectedTenant === "all"}
                          variant="outline"
                        >
                          {syncing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Sync from ChirpStack
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={loadGateways}
                          variant="outline"
                          disabled={loadingGateways}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingGateways ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                        Loading gateways...
                      </div>
                    ) : gateways.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No gateways found.{" "}
                        {selectedTenant !== "all" &&
                          "Click 'Sync from ChirpStack' to import gateways."}
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Gateway Name</TableHead>
                              <TableHead>Gateway ID/MAC</TableHead>
                              <TableHead>Tenant</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gateways.map((gateway) => (
                              <TableRow
                                key={gateway.name}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() =>
                                  router.push(`/pages/gateways/${gateway.name}`)
                                }
                              >
                                <TableCell className="font-medium">
                                  {gateway.gateway_name || gateway.name}
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs">
                                    {gateway.gateway_id_mac ||
                                      gateway.chirpstack_id ||
                                      "—"}
                                  </code>
                                </TableCell>
                                <TableCell>{gateway.tenant || "—"}</TableCell>
                                <TableCell>
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
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm font-mono">
                                  {(() => {
                                    const c = getGatewayCoords(gateway);
                                    return c
                                      ? formatCoordinates(c.lat, c.lng)
                                      : "—";
                                  })()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-black text-white cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/pages/gateways/${gateway.name}`,
                                      );
                                    }}
                                  >
                                    View Frames
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            {totalGateways === 0
                              ? "Showing 0 of 0 gateways"
                              : `Showing ${offset + 1} to ${Math.min(offset + limit, totalGateways)} of ${totalGateways} gateways`}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setOffset(Math.max(0, offset - limit))
                              }
                              disabled={offset === 0 || loadingGateways}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setOffset(offset + limit)}
                              disabled={
                                offset + limit >= totalGateways ||
                                loadingGateways
                              }
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

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
