"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  fetchERPNextTenants,
  fetchERPNextDeviceProfiles,
  listCsDeviceProfiles,
  createCsDeviceProfile,
  updateCsDeviceProfile,
  deleteCsDeviceProfile,
  getCsDeviceProfile,
} from "../../../../lib/api/api";
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
import { Loader2, Plus, Edit, Trash2, Building2, Settings } from "lucide-react";

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

const REGIONS = [
  "EU868",
  "US915",
  "AS923",
  "AU915",
  "CN470",
  "CN779",
  "EU433",
  "IN865",
  "ISM2400",
  "KR920",
  "RU864",
];

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
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [editingProfile, setEditingProfile] = useState<DeviceProfile | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  async function loadTenants() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchERPNextTenants({ fields: ["*"] });
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
      });
      const data = (res as any).data || [];
      setProfiles(data as DeviceProfile[]);
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
    if (!selectedTenant) return;
    try {
      // Note: Creating device profiles in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the create endpoint
      setError(
        "Create functionality for ERPNext device profiles not yet implemented"
      );
      // await createCsDeviceProfile({
      //   name: newName,
      //   tenantId: selectedTenant,
      //   description: newDescription || undefined,
      //   region: newRegion || undefined,
      // });
      // setNewName("");
      // setNewDescription("");
      // setNewRegion("");
      // await loadProfiles(selectedTenant);
    } catch (e: any) {
      setError(e?.message || "Failed to create device profile");
    }
  }

  function handleEdit(profile: DeviceProfile) {
    setEditingProfile(profile);
    setEditName(profile.profile_name || "");
    setEditDescription(profile.small_text || "");
    // Get first region from the region string if multiple regions exist
    const regions = parseRegions(profile.region);
    setEditRegion(regions.length > 0 ? regions[0] : "");
    setIsEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingProfile) return;
    try {
      // Note: Updating device profiles in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the update endpoint
      setError(
        "Update functionality for ERPNext device profiles not yet implemented"
      );
      // await updateCsDeviceProfile(editingProfile.name, {
      //   name: editName,
      //   description: editDescription || undefined,
      //   region: editRegion || undefined,
      // });
      // await loadProfiles(selectedTenant);
      // setIsEditDialogOpen(false);
      // setEditingProfile(null);
    } catch (e: any) {
      setError(e?.message || "Failed to update device profile");
    }
  }

  async function handleDelete(profile: DeviceProfile) {
    try {
      // Note: Deleting device profiles in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the delete endpoint
      setError(
        "Delete functionality for ERPNext device profiles not yet implemented"
      );
      // await deleteCsDeviceProfile(profile.name);
      // await loadProfiles(selectedTenant);
    } catch (e: any) {
      setError(e?.message || "Failed to delete device profile");
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mx-auto max-w-6xl space-y-8">
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
              Note: Create functionality for ERPNext device profiles not yet
              implemented
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
                    <SelectTrigger id="tenant-select" className="min-w-[260px]">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="profile-name" className="mb-2">
                      Profile Name
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
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={!selectedTenant}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Profile
                    </Button>
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
              </form>
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading device profiles...
              </div>
            ) : (
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
                                    <Button variant="destructive" size="sm">
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
                                        Are you sure you want to delete "
                                        {p.profile_name || p.name}"? This action
                                        cannot be undone.
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
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Device Profile</DialogTitle>
              <DialogDescription>
                Update the device profile information (Note: Update
                functionality not yet implemented)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Profile Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter profile name"
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="edit-region">Region</Label>
                <Select
                  value={editRegion}
                  onValueChange={setEditRegion}
                  disabled
                >
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
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter profile description"
                  disabled
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
  );
}
