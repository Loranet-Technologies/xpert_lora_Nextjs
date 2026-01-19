"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { fetchERPNextTenants } from "@/lib/api/tenant/tenant";
import { fetchERPNextApplications } from "@/lib/api/application/application";
import {
  fetchERPNextDevices,
  createERPNextDevice,
  updateERPNextDevice,
  deleteERPNextDevice,
} from "@/lib/api/device/device";
import { fetchERPNextDeviceProfiles } from "@/lib/api/device-profile/device-profile";
import {
  getSubscriptionDeviceByDevice,
  attachDeviceToSubscription,
  removeDeviceFromSubscription,
  getOrganizationSubscriptions,
  type SubscriptionDevice,
  type Subscription,
} from "@/lib/api/subscription/subscription";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Edit,
  Trash2,
  Smartphone,
  RefreshCw,
  Loader2,
  Link2,
  Unlink,
  Pause,
  CreditCard,
} from "lucide-react";

// ERPNext Tenant type
type Tenant = {
  name: string;
  tenant_name: string;
  chirpstack_id?: string;
} & Record<string, any>;

// ERPNext Application type
type Application = {
  name: string;
  application_name: string;
  tenant: string;
  chirpstack_id?: string;
} & Record<string, any>;

// ERPNext Device Profile type
type DeviceProfile = {
  name: string;
  profile_name: string;
  tenant: string;
} & Record<string, any>;

// ERPNext Device type
type Device = {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  device_name: string;
  dev_eui: string;
  application: string;
  application_chirpstack_id?: string;
  chirpstack_id?: string;
  device_profile: string;
  metadata?: any;
  status?: string;
  description?: string;
} & Record<string, any>;

// Helper function to format ERPNext date
function formatERPNextDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  } catch {
    return dateString;
  }
}

export default function DevicesAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [profiles, setProfiles] = useState<DeviceProfile[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", devEui: "", description: "" });

  // Subscription Device state
  const [subscriptionDevices, setSubscriptionDevices] = useState<
    Record<string, { device: SubscriptionDevice; subscription?: Subscription }>
  >({});
  const [loadingSubscriptions, setLoadingSubscriptions] = useState<
    Record<string, boolean>
  >({});
  const [organizations, setOrganizations] = useState<
    Array<{ name: string; organization_name: string }>
  >([]);
  const [attachDialog, setAttachDialog] = useState<{
    open: boolean;
    device: Device | null;
    organizations: Array<{ name: string; organization_name: string }>;
    selectedOrganization: string;
    subscriptions: Subscription[];
    selectedSubscription: string;
    loading: boolean;
    loadingSubscriptions: boolean;
  }>({
    open: false,
    device: null,
    organizations: [],
    selectedOrganization: "",
    subscriptions: [],
    selectedSubscription: "",
    loading: false,
    loadingSubscriptions: false,
  });

  function generateRandomDevEui() {
    const chars = "0123456789abcdef";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, devEui: result });
  }

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    device: Device | null;
    name: string;
    description: string;
    status: string;
    deviceProfile: string;
  }>({
    open: false,
    device: null,
    name: "",
    description: "",
    status: "Active",
    deviceProfile: "",
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    device: Device | null;
  }>({
    open: false,
    device: null,
  });

  async function loadTenants() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchERPNextTenants({ limit: 100, offset: 0 });
      const data = (res as any).data || [];
      setTenants(data as Tenant[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }

  async function loadApps(tenantId?: string) {
    if (!tenantId) {
      setApps([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchERPNextApplications({
        fields: ["*"],
        tenant: tenantId,
      });
      const data = (res as any).data || [];
      setApps(data as Application[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfiles(tenantId?: string) {
    if (!tenantId) {
      setProfiles([]);
      return;
    }
    try {
      const res = await fetchERPNextDeviceProfiles({
        fields: ["*"],
        tenant: tenantId,
      });
      const data = (res as any).data || [];
      setProfiles(data as DeviceProfile[]);
    } catch (e: any) {
      console.error("Failed to load device profiles:", e);
      setProfiles([]);
    }
  }

  async function loadDevices(appId?: string) {
    if (!appId) {
      setDevices([]);
      setSubscriptionDevices({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchERPNextDevices({
        application: appId,
        limit: 100,
        offset: 0,
      });
      const data = (res as any).data || [];
      // Filter devices by application on client side as well to ensure correctness
      const filteredData = data.filter(
        (device: Device) => device.application === appId
      );
      setDevices(filteredData as Device[]);

      // Load subscription info for all devices
      await loadSubscriptionInfoForDevices(filteredData);
    } catch (e: any) {
      setError(e?.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscriptionInfoForDevices(deviceList: Device[]) {
    // Load subscription info for each device in parallel
    const promises = deviceList.map(async (device) => {
      if (loadingSubscriptions[device.name]) return;

      setLoadingSubscriptions((prev) => ({ ...prev, [device.name]: true }));
      try {
        const result = await getSubscriptionDeviceByDevice(device.name);
        if (result.data) {
          setSubscriptionDevices((prev) => ({
            ...prev,
            [device.name]: {
              device: result.data!,
              subscription: result.subscription,
            },
          }));
        } else {
          // Remove from state if no subscription
          setSubscriptionDevices((prev) => {
            const newState = { ...prev };
            delete newState[device.name];
            return newState;
          });
        }
      } catch (e) {
        console.error(
          `Failed to load subscription for device ${device.name}:`,
          e
        );
      } finally {
        setLoadingSubscriptions((prev) => {
          const newState = { ...prev };
          delete newState[device.name];
          return newState;
        });
      }
    });
    await Promise.all(promises);
  }

  async function loadSubscriptionInfo(deviceId: string) {
    setLoadingSubscriptions((prev) => ({ ...prev, [deviceId]: true }));
    try {
      const result = await getSubscriptionDeviceByDevice(deviceId);
      if (result.data) {
        setSubscriptionDevices((prev) => ({
          ...prev,
          [deviceId]: {
            device: result.data!,
            subscription: result.subscription,
          },
        }));
      } else {
        setSubscriptionDevices((prev) => {
          const newState = { ...prev };
          delete newState[deviceId];
          return newState;
        });
      }
    } catch (e) {
      console.error(`Failed to load subscription for device ${deviceId}:`, e);
    } finally {
      setLoadingSubscriptions((prev) => {
        const newState = { ...prev };
        delete newState[deviceId];
        return newState;
      });
    }
  }

  async function loadOrganizations() {
    try {
      const token = await import("@/lib/api/utils/token").then((m) =>
        m.getERPNextToken()
      );
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch("/api/erpnext/organization", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load organizations");
      }

      const data = await response.json();
      const orgs = data.data || data.message?.data || data.message || [];
      setOrganizations(orgs);
      return orgs;
    } catch (e: any) {
      console.error("Failed to load organizations:", e);
      throw e;
    }
  }

  async function openAttachDialog(device: Device) {
    setError(null);
    setAttachDialog({
      open: true,
      device,
      organizations: [],
      selectedOrganization: "",
      subscriptions: [],
      selectedSubscription: "",
      loading: true,
      loadingSubscriptions: false,
    });

    try {
      // Load organizations
      const orgs = await loadOrganizations();
      setAttachDialog((prev) => ({
        ...prev,
        organizations: orgs,
        loading: false,
      }));
    } catch (e: any) {
      setError(e?.message || "Failed to load organizations");
      setAttachDialog((prev) => ({ ...prev, loading: false }));
    }
  }

  async function loadSubscriptionsForOrganization(organizationId: string) {
    if (!organizationId) {
      setAttachDialog((prev) => ({
        ...prev,
        subscriptions: [],
        selectedSubscription: "",
        loadingSubscriptions: false,
      }));
      return;
    }

    setAttachDialog((prev) => ({
      ...prev,
      loadingSubscriptions: true,
      subscriptions: [],
      selectedSubscription: "",
    }));

    try {
      const result = await getOrganizationSubscriptions(organizationId);
      setAttachDialog((prev) => ({
        ...prev,
        subscriptions: result.data || [],
        loadingSubscriptions: false,
      }));
    } catch (e: any) {
      setError(e?.message || "Failed to load subscriptions");
      setAttachDialog((prev) => ({
        ...prev,
        subscriptions: [],
        loadingSubscriptions: false,
      }));
    }
  }

  async function handleAttachDevice() {
    if (!attachDialog.device || !attachDialog.selectedSubscription) {
      setError("Please select a subscription");
      return;
    }

    setError(null);
    setSuccess(null);
    setAttachDialog((prev) => ({ ...prev, loading: true }));

    try {
      await attachDeviceToSubscription({
        subscription: attachDialog.selectedSubscription,
        device: attachDialog.device.name,
      });

      setSuccess("Device attached to subscription successfully!");
      await loadSubscriptionInfo(attachDialog.device.name);
      setAttachDialog({
        open: false,
        device: null,
        organizations: [],
        selectedOrganization: "",
        subscriptions: [],
        selectedSubscription: "",
        loading: false,
        loadingSubscriptions: false,
      });
    } catch (e: any) {
      setError(e?.message || "Failed to attach device");
    } finally {
      setAttachDialog((prev) => ({ ...prev, loading: false }));
    }
  }

  async function handleRemoveDevice(
    subscriptionDeviceId: string,
    deviceId: string,
    action: "disable" | "delete" = "disable"
  ) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await removeDeviceFromSubscription(subscriptionDeviceId, action);
      setSuccess(
        `Device ${action === "disable" ? "suspended" : "removed"} successfully!`
      );
      await loadSubscriptionInfo(deviceId);
    } catch (e: any) {
      setError(e?.message || `Failed to ${action} device`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);
  useEffect(() => {
    if (selectedTenant) {
      loadApps(selectedTenant);
      loadProfiles(selectedTenant);
    } else {
      setApps([]);
      setProfiles([]);
    }
  }, [selectedTenant]);
  useEffect(() => {
    if (selectedApp) {
      loadDevices(selectedApp);
    } else {
      setDevices([]);
    }
  }, [selectedApp]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (
      !selectedApp ||
      !selectedProfile ||
      !form.name.trim() ||
      !form.devEui.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Clear any previous errors
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await createERPNextDevice({
        device_name: form.name.trim(),
        dev_eui: form.devEui.trim(),
        application: selectedApp,
        device_profile: selectedProfile,
        status: "Active",
        description: form.description.trim() || undefined,
      });

      setForm({ name: "", devEui: "", description: "" });
      setSelectedProfile(""); // Reset profile selection
      setSuccess("Device created successfully!");
      await loadDevices(selectedApp);
    } catch (e: any) {
      console.error("Device creation error:", e);

      // Handle specific error messages
      let errorMessage = "Failed to create device";
      if (e?.message?.includes("already exists")) {
        errorMessage = `Device with DevEUI "${form.devEui}" already exists. Please use a different DevEUI.`;
      } else if (e?.message?.includes("Device profile")) {
        errorMessage = "Please select a device profile";
      } else if (e?.message?.includes("Application")) {
        errorMessage = "Please select an application";
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!editDialog.device || !editDialog.name.trim()) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await updateERPNextDevice(editDialog.device.name, {
        device_name: editDialog.name.trim(),
        description: editDialog.description.trim() || undefined,
        status: editDialog.status,
        device_profile:
          editDialog.deviceProfile || editDialog.device.device_profile,
      });

      setSuccess("Device updated successfully!");
      await loadDevices(selectedApp);
      setEditDialog({
        open: false,
        device: null,
        name: "",
        description: "",
        status: "Active",
        deviceProfile: "",
      });
    } catch (e: any) {
      setError(e?.message || "Failed to update device");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.device) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await deleteERPNextDevice(deleteDialog.device.name);
      setSuccess("Device deleted successfully!");
      await loadDevices(selectedApp);
      setDeleteDialog({ open: false, device: null });
    } catch (e: any) {
      setError(e?.message || "Failed to delete device");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Device Management
                </h1>
                <p className="text-muted-foreground">
                  Manage IoT devices from ERPNext
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Device
                </CardTitle>
                <CardDescription>
                  Create a new device in ERPNext. The device will be synced with
                  ChirpStack.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant-select">Tenant</Label>
                    <Select
                      value={selectedTenant}
                      onValueChange={(value) => {
                        setSelectedTenant(value);
                        setSelectedApp("");
                      }}
                    >
                      <SelectTrigger id="tenant-select">
                        <SelectValue placeholder="Select tenant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((t) => (
                          <SelectItem key={t.name} value={t.name}>
                            {t.tenant_name || t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="app-select">Application</Label>
                    <Select
                      value={selectedApp}
                      onValueChange={setSelectedApp}
                      disabled={!selectedTenant}
                    >
                      <SelectTrigger id="app-select">
                        <SelectValue placeholder="Select application..." />
                      </SelectTrigger>
                      <SelectContent>
                        {apps.map((a) => (
                          <SelectItem key={a.name} value={a.name}>
                            {a.application_name || a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="device-type-select">Device Sync</Label>
                    <Button variant="outline">Sync from ChirpStack</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-select">Device Profile</Label>
                  <Select
                    value={selectedProfile}
                    onValueChange={setSelectedProfile}
                    disabled={!selectedTenant}
                  >
                    <SelectTrigger id="profile-select">
                      <SelectValue placeholder="Select device profile..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          {p.profile_name || p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <form onSubmit={onCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="device-name">Device Name *</Label>
                      <Input
                        id="device-name"
                        placeholder="Enter device name..."
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dev-eui">DevEUI *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="dev-eui"
                          placeholder="Enter DevEUI (16 hex characters)..."
                          value={form.devEui}
                          onChange={(e) =>
                            setForm({ ...form, devEui: e.target.value })
                          }
                          required
                          className="flex-1"
                          pattern="[0-9a-fA-F]{16}"
                          maxLength={16}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateRandomDevEui}
                          className="px-3"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="device-description">Description</Label>
                      <Input
                        id="device-description"
                        placeholder="Enter description (optional)..."
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={
                        !selectedApp ||
                        !selectedProfile ||
                        !form.name.trim() ||
                        !form.devEui.trim() ||
                        loading
                      }
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Device
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Devices</CardTitle>
                <CardDescription>
                  {selectedApp
                    ? `${devices.length} device${
                        devices.length !== 1 ? "s" : ""
                      } from ERPNext`
                    : "Select an application to view devices"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Device Name</TableHead>
                        <TableHead>DevEUI</TableHead>
                        <TableHead>ChirpStack ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Skeleton className="h-6 w-20" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-32" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-32" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-24" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-16" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-24" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-40" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-28" />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <>
                          {devices.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                className="text-center py-8 text-muted-foreground"
                              >
                                {selectedApp
                                  ? "No devices found"
                                  : "Select an application to view devices"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            devices.map((d) => {
                              const subscriptionInfo =
                                subscriptionDevices[d.name];
                              const isLoadingSub = loadingSubscriptions[d.name];

                              return (
                                <TableRow key={d.name}>
                                  <TableCell className="font-mono text-sm">
                                    <Badge variant="outline">
                                      {d.name?.substring(0, 8)}...
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {d.device_name || "—"}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {d.dev_eui || "—"}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {d.chirpstack_id || "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        d.status === "Active"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {d.status || "—"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {isLoadingSub ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : subscriptionInfo ? (
                                      <div className="flex flex-col gap-1">
                                        <Badge
                                          variant="outline"
                                          className="w-fit"
                                        >
                                          <CreditCard className="h-3 w-3 mr-1" />
                                          {subscriptionInfo.subscription
                                            ?.plan_details?.plan_name ||
                                            subscriptionInfo.device
                                              .subscription}
                                        </Badge>
                                        <span className="text-xs text-green-500">
                                          {subscriptionInfo.device.status ===
                                          "Active" ? (
                                            <span className="text-green-500">
                                              Active
                                            </span>
                                          ) : (
                                            <span className="text-red-500">
                                              Inactive
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">
                                        Not attached
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {d.description || "—"}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {formatERPNextDate(d.creation)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditDialog({
                                            open: true,
                                            device: d,
                                            name: d.device_name || "",
                                            description: d.description || "",
                                            status: d.status || "Active",
                                            deviceProfile:
                                              d.device_profile || "",
                                          });
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                      {subscriptionInfo ? (
                                        <>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                              >
                                                <Pause className="h-4 w-4 mr-1" />
                                                Suspend
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  Suspend Device from
                                                  Subscription
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to
                                                  suspend this device from its
                                                  subscription? The device will
                                                  be disabled but the record
                                                  will be kept.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    handleRemoveDevice(
                                                      subscriptionInfo.device
                                                        .name,
                                                      d.name,
                                                      "disable"
                                                    )
                                                  }
                                                >
                                                  Suspend
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                              >
                                                <Unlink className="h-4 w-4 mr-1" />
                                                Remove
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  Remove Device from
                                                  Subscription
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to
                                                  permanently remove this device
                                                  from its subscription? This
                                                  action cannot be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    handleRemoveDevice(
                                                      subscriptionInfo.device
                                                        .name,
                                                      d.name,
                                                      "delete"
                                                    )
                                                  }
                                                >
                                                  Remove
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openAttachDialog(d)}
                                        >
                                          <Link2 className="h-4 w-4 mr-1" />
                                          Attach
                                        </Button>
                                      )}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                          >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete Device
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete
                                              &quot;
                                              {d.device_name || d.name}&quot;
                                              (DevEUI: {d.dev_eui || d.name})?
                                              This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => {
                                                setDeleteDialog({
                                                  open: true,
                                                  device: d,
                                                });
                                                setTimeout(
                                                  () => handleDelete(),
                                                  0
                                                );
                                              }}
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={editDialog.open}
              onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Device</DialogTitle>
                  <DialogDescription>
                    Update the device details. Changes will be synced with
                    ChirpStack.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Device Name *</Label>
                    <Input
                      id="edit-name"
                      value={editDialog.name}
                      onChange={(e) =>
                        setEditDialog({ ...editDialog, name: e.target.value })
                      }
                      placeholder="Enter device name..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      value={editDialog.description}
                      onChange={(e) =>
                        setEditDialog({
                          ...editDialog,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter description (optional)..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editDialog.status}
                      onValueChange={(value) =>
                        setEditDialog({ ...editDialog, status: value })
                      }
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setEditDialog({
                        open: false,
                        device: null,
                        name: "",
                        description: "",
                        status: "Active",
                        deviceProfile: "",
                      })
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEdit}
                    disabled={!editDialog.name.trim() || loading}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={attachDialog.open}
              onOpenChange={(open) =>
                setAttachDialog({ ...attachDialog, open })
              }
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Attach Device to Subscription</DialogTitle>
                  <DialogDescription>
                    Link this device to a subscription plan. The device will be
                    covered by the subscription&apos;s limits and billing.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {attachDialog.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="organization-select">
                          Organization *
                        </Label>
                        <Select
                          value={attachDialog.selectedOrganization}
                          onValueChange={(value) => {
                            setAttachDialog({
                              ...attachDialog,
                              selectedOrganization: value,
                              selectedSubscription: "",
                            });
                            loadSubscriptionsForOrganization(value);
                          }}
                        >
                          <SelectTrigger id="organization-select">
                            <SelectValue placeholder="Select organization..." />
                          </SelectTrigger>
                          <SelectContent>
                            {attachDialog.organizations.map((org) => (
                              <SelectItem key={org.name} value={org.name}>
                                {org.organization_name || org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Select the organization to view its subscriptions.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="subscription-select">
                          Subscription *
                        </Label>
                        {attachDialog.loadingSubscriptions ? (
                          <div className="flex items-center gap-2 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              Loading subscriptions...
                            </span>
                          </div>
                        ) : (
                          <Select
                            value={attachDialog.selectedSubscription}
                            onValueChange={(value) =>
                              setAttachDialog({
                                ...attachDialog,
                                selectedSubscription: value,
                              })
                            }
                            disabled={!attachDialog.selectedOrganization}
                          >
                            <SelectTrigger id="subscription-select">
                              <SelectValue
                                placeholder={
                                  attachDialog.selectedOrganization
                                    ? "Select subscription..."
                                    : "Select organization first"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {attachDialog.subscriptions.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  {attachDialog.selectedOrganization
                                    ? "No subscriptions found"
                                    : "Select an organization first"}
                                </div>
                              ) : (
                                attachDialog.subscriptions.map((sub) => (
                                  <SelectItem key={sub.name} value={sub.name}>
                                    {sub.plan_details?.plan_name ||
                                      sub.plan ||
                                      sub.name}{" "}
                                    ({sub.status})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Select a subscription to attach this device to.
                        </p>
                      </div>
                      {attachDialog.device && (
                        <div className="text-sm text-muted-foreground">
                          <p>
                            <strong>Device:</strong>{" "}
                            {attachDialog.device.device_name ||
                              attachDialog.device.name}
                          </p>
                          <p>
                            <strong>DevEUI:</strong>{" "}
                            {attachDialog.device.dev_eui || "—"}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setAttachDialog({
                        open: false,
                        device: null,
                        organizations: [],
                        selectedOrganization: "",
                        subscriptions: [],
                        selectedSubscription: "",
                        loading: false,
                        loadingSubscriptions: false,
                      })
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAttachDevice}
                    disabled={
                      !attachDialog.selectedSubscription.trim() ||
                      attachDialog.loading ||
                      attachDialog.loadingSubscriptions
                    }
                  >
                    {attachDialog.loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Attaching...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Attach Device
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
