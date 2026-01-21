"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listERPNextGateways,
  syncERPNextGateways,
} from "@/lib/api/gateway/gateway";
import { fetchERPNextTenants } from "@/lib/api/tenant/tenant";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { Loader2, Radio, RefreshCw } from "lucide-react";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

// Tenant type
type Tenant = {
  name: string;
  tenant_name: string;
  chirpstack_id?: string;
} & Record<string, any>;

export default function GatewayListPage() {
  const router = useRouter();

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Gateway list state
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [loadingGateways, setLoadingGateways] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [totalGateways, setTotalGateways] = useState<number>(0);
  const [limit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);

  // Load tenants
  async function loadTenants() {
    try {
      const res = await fetchERPNextTenants({ fields: ["*"] });
      const data = (res as any).data || [];
      setTenants(data as Tenant[]);
    } catch (e: any) {
      console.error("Failed to load tenants:", e);
    }
  }

  // Load gateways
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

  // Sync gateways from ChirpStack
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
        // Reload gateways after sync
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

  // Load tenants on mount
  useEffect(() => {
    loadTenants();
  }, []);

  // Load gateways when tenant or pagination changes
  useEffect(() => {
    loadGateways();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant, offset]);

  function formatCoordinates(lat?: number, lon?: number): string {
    if (lat === undefined || lon === undefined || lat === 0 || lon === 0) {
      return "—";
    }
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

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
                <h1 className="text-3xl font-bold tracking-tight">
                  Gateway List
                </h1>
                <p className="text-muted-foreground">
                  Manage and view gateways from ChirpStack
                </p>
              </div>
            </div>

            {/* Gateway List Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gateways</CardTitle>
                    <CardDescription>
                      {totalGateways} gateway{totalGateways !== 1 ? "s" : ""}{" "}
                      found
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
                              router.push(`/pages/gateway-list/${gateway.name}`)
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
                            <TableCell>
                              {formatCoordinates(
                                gateway.latitude,
                                gateway.longitude
                              )}
                            </TableCell>

                            <TableCell>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-black text-white  cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/pages/gateway-list/${gateway.name}`
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
                        Showing {offset + 1} to{" "}
                        {Math.min(offset + limit, totalGateways)} of{" "}
                        {totalGateways} gateways
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOffset(Math.max(0, offset - limit))}
                          disabled={offset === 0 || loadingGateways}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOffset(offset + limit)}
                          disabled={
                            offset + limit >= totalGateways || loadingGateways
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
