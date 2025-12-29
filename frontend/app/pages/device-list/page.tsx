"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listERPNextDevices } from "@/lib/api/device/device";
import { fetchERPNextTenants } from "@/lib/api/tenant/tenant";
import { fetchERPNextApplications } from "@/lib/api/application/application";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
import { Loader2, Smartphone, RefreshCw } from "lucide-react";
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

// Tenant type
type Tenant = {
  name: string;
  tenant_name: string;
  chirpstack_id?: string;
} & Record<string, any>;

// Application type
type Application = {
  name: string;
  application_name: string;
  tenant: string;
  chirpstack_id?: string;
} & Record<string, any>;

export default function DeviceListPage() {
  const router = useRouter();

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Device list state
  const [devices, setDevices] = useState<Device[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<string>("all");
  const [loadingDevices, setLoadingDevices] = useState<boolean>(false);
  const [totalDevices, setTotalDevices] = useState<number>(0);
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

  // Load applications
  async function loadApplications() {
    try {
      if (selectedTenant && selectedTenant !== "all") {
        const res = await fetchERPNextApplications({
          fields: ["*"],
          filters: JSON.stringify([["tenant", "=", selectedTenant]]),
        });
        const data = (res as any).data || [];
        setApplications(data as Application[]);
      } else {
        setApplications([]);
      }
    } catch (e: any) {
      console.error("Failed to load applications:", e);
    }
  }

  // Load devices
  async function loadDevices() {
    setLoadingDevices(true);
    setError(null);
    try {
      const filters: any = {};
      if (selectedTenant && selectedTenant !== "all") {
        // Note: We filter by application which is linked to tenant
        // If you have a direct tenant field on devices, use that instead
      }
      if (selectedApplication && selectedApplication !== "all") {
        filters.application = selectedApplication;
      }

      const res = await listERPNextDevices({
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        limit,
        offset,
      });

      const data = res.data || [];
      const total = res.total || 0;
      setDevices(data as Device[]);
      setTotalDevices(total);
    } catch (e: any) {
      setError(e?.message || "Failed to load devices");
    } finally {
      setLoadingDevices(false);
    }
  }

  // Load tenants on mount
  useEffect(() => {
    loadTenants();
  }, []);

  // Load applications when tenant changes
  useEffect(() => {
    loadApplications();
    setSelectedApplication("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  // Load devices when filters or pagination changes
  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant, selectedApplication, offset]);

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
                  <BreadcrumbPage>Device List</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Device List
                </h1>
                <p className="text-muted-foreground">
                  Manage and view devices from ChirpStack
                </p>
              </div>
            </div>

            {/* Device List Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Devices</CardTitle>
                    <CardDescription>
                      {totalDevices} device{totalDevices !== 1 ? "s" : ""} found
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
                    {selectedTenant !== "all" && (
                      <Select
                        value={selectedApplication}
                        onValueChange={(value) => {
                          setSelectedApplication(value);
                          setOffset(0);
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select application" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Applications</SelectItem>
                          {applications.map((app) => (
                            <SelectItem key={app.name} value={app.name}>
                              {app.application_name || app.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      onClick={loadDevices}
                      variant="outline"
                      disabled={loadingDevices}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDevices ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                    Loading devices...
                  </div>
                ) : devices.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No devices found.
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Device Name</TableHead>
                          <TableHead>Device EUI</TableHead>
                          <TableHead>Application</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {devices.map((device) => (
                          <TableRow
                            key={device.name}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              router.push(`/pages/device-list/${device.name}`)
                            }
                          >
                            <TableCell className="font-medium">
                              {device.device_name || device.name}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs">
                                {device.dev_eui || device.chirpstack_id || "—"}
                              </code>
                            </TableCell>
                            <TableCell>{device.application || "—"}</TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-black text-white cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/pages/device-list/${device.name}`
                                  );
                                }}
                              >
                                View Events
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {offset + 1} to{" "}
                        {Math.min(offset + limit, totalDevices)} of{" "}
                        {totalDevices} devices
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOffset(Math.max(0, offset - limit))}
                          disabled={offset === 0 || loadingDevices}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOffset(offset + limit)}
                          disabled={
                            offset + limit >= totalDevices || loadingDevices
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
