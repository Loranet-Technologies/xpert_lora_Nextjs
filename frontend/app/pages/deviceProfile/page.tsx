"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  fetchERPNextTenants,
  fetchERPNextDeviceProfiles,
  createERPNextDeviceProfile,
  updateERPNextDeviceProfile,
  deleteERPNextDeviceProfile,
} from "../../../lib/api/api";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
import { Plus, Edit, Trash2, Building2, Settings } from "lucide-react";

// ERPNext Tenant type
type Tenant = {
  name: string;
  tenant_name: string;
  chirpstack_id?: string;
} & Record<string, any>;

// ERPNext Device Profile type
type DeviceProfile = {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  profile_name: string;
  chirpstack_id?: string;
  tenant: string;
  region?: string;
  small_text?: string;
  mac_version?: string;
  regional_parameters_revision?: string;
  supports_otaa_join?: number;
  supports_32_bit_frame_counter?: number;
  metadata?: any;
} & Record<string, any>;

// Only AS923 is available as per requirements
const REGIONS = ["AS923"];

// Mapping from ChirpStack region enum numbers to region names
const REGION_ENUM_TO_NAME: { [key: number]: string } = {
  0: "EU868",
  2: "US915",
  3: "CN779",
  4: "EU433",
  5: "AU915",
  6: "CN470",
  7: "AS923",
  8: "KR920",
  9: "IN865",
  10: "RU864",
  11: "ISM2400",
  12: "AS923_2",
  13: "AS923_3",
  14: "AS923_4",
};

// Helper function to convert region enum to readable name
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRegionName(regionEnum: number | string | undefined): string {
  if (typeof regionEnum === "string") {
    return regionEnum;
  }
  if (typeof regionEnum === "number") {
    return REGION_ENUM_TO_NAME[regionEnum] || "Unknown";
  }
  return "N/A";
}

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

// Helper function to parse region string (can be multiple regions separated by \n)
function parseRegions(regionString?: string): string[] {
  if (!regionString) return [];
  // Split by \n and filter out empty strings
  return regionString.split("\\n").filter((r) => r.trim().length > 0);
}

export default function DeviceProfileAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [profiles, setProfiles] = useState<DeviceProfile[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRegion, setNewRegion] = useState("AS923");
  const [newMacVersion, setNewMacVersion] = useState("LORAWAN_1_0_3");
  const [newRegionalParams, setNewRegionalParams] = useState("A");
  const [newSupportsOtaa, setNewSupportsOtaa] = useState(true);
  const [newSupports32Bit, setNewSupports32Bit] = useState(false);
  const [editingProfile, setEditingProfile] = useState<DeviceProfile | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRegion, setEditRegion] = useState("AS923");
  const [editMacVersion, setEditMacVersion] = useState("LORAWAN_1_0_3");
  const [editRegionalParams, setEditRegionalParams] = useState("A");
  const [editSupportsOtaa, setEditSupportsOtaa] = useState(true);
  const [editSupports32Bit, setEditSupports32Bit] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  async function loadProfiles(tenantId?: string) {
    if (!tenantId) {
      setProfiles([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchERPNextDeviceProfiles({
        fields: ["*"],
        tenant: tenantId,
        limit: 100,
        offset: 0,
      });
      const data = (res as any).data || [];
      // Filter device profiles by tenant on client side as well to ensure correctness
      const filteredData = data.filter(
        (profile: DeviceProfile) => profile.tenant === tenantId
      );
      setProfiles(filteredData as DeviceProfile[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load device profiles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      loadProfiles(selectedTenant);
    } else {
      setProfiles([]);
    }
  }, [selectedTenant]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenant || !newName.trim()) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // ERPNext requires region values to end with \n
      // Ensure region always ends with \n (backend validation requires it)
      let regionValue = (newRegion || "AS923").trim();
      if (!regionValue.endsWith("\n")) {
        regionValue = regionValue + "\n";
      }

      const profileData: any = {
        profile_name: newName.trim(),
        tenant: selectedTenant,
        region: regionValue,
        mac_version: newMacVersion || "LORAWAN_1_0_3",
        regional_parameters_revision: newRegionalParams || "A",
        supports_otaa_join: newSupportsOtaa ? 1 : 0,
        supports_32_bit_frame_counter: newSupports32Bit ? 1 : 0,
      };

      // Only include small_text if it has a value
      if (newDescription && newDescription.trim()) {
        profileData.small_text = newDescription.trim();
      }

      // Debug: Verify region has \n
      console.log("Creating device profile with data:", {
        ...profileData,
        region_debug: `"${profileData.region}" (length: ${
          profileData.region.length
        }, ends with \\n: ${profileData.region.endsWith("\n")})`,
      });
      const result = await createERPNextDeviceProfile(profileData);
      console.log("Device profile created successfully:", result);

      setNewName("");
      setNewDescription("");
      setNewRegion("AS923");
      setNewMacVersion("LORAWAN_1_0_3");
      setNewRegionalParams("A");
      setNewSupportsOtaa(true);
      setNewSupports32Bit(false);
      setSuccess("Device profile created successfully!");
      await loadProfiles(selectedTenant);
    } catch (e: any) {
      console.error("Error creating device profile:", e);
      const errorMessage =
        e?.message || e?.error || "Failed to create device profile";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(profile: DeviceProfile) {
    setEditingProfile(profile);
    setEditName(profile.profile_name || "");
    setEditDescription(profile.small_text || "");
    // Get first region from the region string if multiple regions exist
    // Remove trailing \n if present (ERPNext stores regions with \n)
    let regionValue = profile.region || "";
    if (regionValue.endsWith("\n")) {
      regionValue = regionValue.slice(0, -1);
    }
    const regions = parseRegions(regionValue);
    setEditRegion(regions.length > 0 ? regions[0] : regionValue || "AS923");
    setEditMacVersion(profile.mac_version || "LORAWAN_1_0_3");
    setEditRegionalParams(profile.regional_parameters_revision || "A");
    setEditSupportsOtaa(profile.supports_otaa_join === 1);
    setEditSupports32Bit(profile.supports_32_bit_frame_counter === 1);
    setIsEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingProfile || !editName.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      // ERPNext requires region values to end with \n
      // Ensure region always ends with \n (backend validation requires it)
      let regionValue = (editRegion || "AS923").trim();
      if (!regionValue.endsWith("\n")) {
        regionValue = regionValue + "\n";
      }

      await updateERPNextDeviceProfile(editingProfile.name, {
        profile_name: editName.trim(),
        region: regionValue,
        small_text: editDescription.trim() || undefined,
        mac_version: editMacVersion || "LORAWAN_1_0_3",
        regional_parameters_revision: editRegionalParams || "A",
        supports_otaa_join: editSupportsOtaa ? 1 : 0,
        supports_32_bit_frame_counter: editSupports32Bit ? 1 : 0,
      });
      setSuccess("Device profile updated successfully!");
      await loadProfiles(selectedTenant);
      setIsEditDialogOpen(false);
      setEditingProfile(null);
    } catch (e: any) {
      setError(e?.message || "Failed to update device profile");
    }
  }

  async function handleDelete(profile: DeviceProfile) {
    setError(null);
    setSuccess(null);
    try {
      await deleteERPNextDeviceProfile(profile.name);
      setSuccess("Device profile deleted successfully!");
      await loadProfiles(selectedTenant);
    } catch (e: any) {
      setError(e?.message || "Failed to delete device profile");
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Device Profiles
                </h1>
                <p className="text-muted-foreground">
                  Manage device profiles from ERPNext
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Device Profile
                </CardTitle>
                <CardDescription>
                  Create a new device profile in ERPNext. The device profile
                  will be synced with ChirpStack.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="tenant-select" className="mb-2">
                        Tenant
                      </Label>
                      <Select
                        value={selectedTenant}
                        onValueChange={setSelectedTenant}
                      >
                        <SelectTrigger
                          id="tenant-select"
                          className="min-w-[260px]"
                        >
                          <SelectValue placeholder="Select tenant..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((t) => (
                            <SelectItem key={t.name} value={t.name}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {t.tenant_name || t.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <form onSubmit={onCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="profile-name" className="mb-2">
                          Profile Name *
                        </Label>
                        <Input
                          id="profile-name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Enter profile name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-region" className="mb-2">
                          Region
                        </Label>
                        <Select value={newRegion} onValueChange={setNewRegion}>
                          <SelectTrigger id="profile-region">
                            <SelectValue placeholder="Select region..." />
                          </SelectTrigger>
                          <SelectContent>
                            {REGIONS.map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="profile-mac-version" className="mb-2">
                          MAC Version
                        </Label>
                        <Select
                          value={newMacVersion}
                          onValueChange={setNewMacVersion}
                        >
                          <SelectTrigger id="profile-mac-version">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LORAWAN_1_0_0">
                              LoRaWAN 1.0.0
                            </SelectItem>
                            <SelectItem value="LORAWAN_1_0_1">
                              LoRaWAN 1.0.1
                            </SelectItem>
                            <SelectItem value="LORAWAN_1_0_2">
                              LoRaWAN 1.0.2
                            </SelectItem>
                            <SelectItem value="LORAWAN_1_0_3">
                              LoRaWAN 1.0.3
                            </SelectItem>
                            <SelectItem value="LORAWAN_1_0_4">
                              LoRaWAN 1.0.4
                            </SelectItem>
                            <SelectItem value="LORAWAN_1_1_0">
                              LoRaWAN 1.1.0
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="profile-regional-params"
                          className="mb-2"
                        >
                          Regional Parameters Revision
                        </Label>
                        <Select
                          value={newRegionalParams}
                          onValueChange={setNewRegionalParams}
                        >
                          <SelectTrigger id="profile-regional-params">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="supports-otaa"
                          checked={newSupportsOtaa}
                          onChange={(e) => setNewSupportsOtaa(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                          htmlFor="supports-otaa"
                          className="cursor-pointer"
                        >
                          Supports OTAA (Join)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="supports-32bit"
                          checked={newSupports32Bit}
                          onChange={(e) =>
                            setNewSupports32Bit(e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                          htmlFor="supports-32bit"
                          className="cursor-pointer"
                        >
                          Supports 32-bit Frame Counter
                        </Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="profile-description" className="mb-2">
                        Description
                      </Label>
                      <Input
                        id="profile-description"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Enter profile description (optional)"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="submit"
                        disabled={!selectedTenant || !newName.trim()}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Profile
                      </Button>
                    </div>
                  </form>
                </div>
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
                <CardTitle>Device Profiles</CardTitle>
                <CardDescription>
                  {selectedTenant
                    ? `${profiles.length} profile${
                        profiles.length !== 1 ? "s" : ""
                      } from ERPNext`
                    : "Select a tenant to view device profiles"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Profile Name</TableHead>
                        <TableHead>ChirpStack ID</TableHead>
                        <TableHead>Region(s)</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>MAC Version</TableHead>
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
                              <Skeleton className="h-5 w-24" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-16" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-40" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-28" />
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
                          {profiles.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                className="text-center py-8 text-muted-foreground"
                              >
                                {selectedTenant
                                  ? "No device profiles found"
                                  : "Select a tenant to view device profiles"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            profiles.map((p) => {
                              const regions = parseRegions(p.region);
                              return (
                                <TableRow key={p.name}>
                                  <TableCell className="font-mono text-sm">
                                    <Badge variant="outline">
                                      {p.name?.substring(0, 8)}...
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {p.profile_name || "—"}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {p.chirpstack_id || "—"}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {regions.length > 0 ? (
                                        regions.map((region, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {region}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-muted-foreground text-sm">
                                          —
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {p.small_text || "—"}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {p.mac_version || "—"}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {formatERPNextDate(p.creation)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(p)}
                                      >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                          >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete Device Profile
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete
                                              &quot;
                                              {p.profile_name || p.name}&quot;?
                                              This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDelete(p)}
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Device Profile</DialogTitle>
                  <DialogDescription>
                    Update the device profile details. Changes will be synced
                    with ChirpStack.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Profile Name *</Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter profile name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-region">Region</Label>
                      <Select value={editRegion} onValueChange={setEditRegion}>
                        <SelectTrigger id="edit-region">
                          <SelectValue placeholder="Select region..." />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-mac-version">MAC Version</Label>
                      <Select
                        value={editMacVersion}
                        onValueChange={setEditMacVersion}
                      >
                        <SelectTrigger id="edit-mac-version">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LORAWAN_1_0_0">
                            LoRaWAN 1.0.0
                          </SelectItem>
                          <SelectItem value="LORAWAN_1_0_1">
                            LoRaWAN 1.0.1
                          </SelectItem>
                          <SelectItem value="LORAWAN_1_0_2">
                            LoRaWAN 1.0.2
                          </SelectItem>
                          <SelectItem value="LORAWAN_1_0_3">
                            LoRaWAN 1.0.3
                          </SelectItem>
                          <SelectItem value="LORAWAN_1_0_4">
                            LoRaWAN 1.0.4
                          </SelectItem>
                          <SelectItem value="LORAWAN_1_1_0">
                            LoRaWAN 1.1.0
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-regional-params">
                        Regional Parameters Revision
                      </Label>
                      <Select
                        value={editRegionalParams}
                        onValueChange={setEditRegionalParams}
                      >
                        <SelectTrigger id="edit-regional-params">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-supports-otaa"
                        checked={editSupportsOtaa}
                        onChange={(e) => setEditSupportsOtaa(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label
                        htmlFor="edit-supports-otaa"
                        className="cursor-pointer"
                      >
                        Supports OTAA (Join)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-supports-32bit"
                        checked={editSupports32Bit}
                        onChange={(e) => setEditSupports32Bit(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label
                        htmlFor="edit-supports-32bit"
                        className="cursor-pointer"
                      >
                        Supports 32-bit Frame Counter
                      </Label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Enter profile description (optional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
