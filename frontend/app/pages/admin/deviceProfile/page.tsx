"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  listOrganizations,
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
import { Loader2, Plus, Edit, Trash2, Building2, Settings } from "lucide-react";

type OrgItem = { id: string; name?: string };
type DeviceProfileItem = {
  id: string;
  name?: string;
  description?: string;
  region?: string | number;
};

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

export default function DeviceProfileAdminPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [profiles, setProfiles] = useState<DeviceProfileItem[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [editingProfile, setEditingProfile] =
    useState<DeviceProfileItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  async function loadOrgs() {
    const res = await listOrganizations({ limit: 100 });
    setOrgs((res as any).resultList || []);
  }

  async function loadProfiles(tenantId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await listCsDeviceProfiles({ tenantId });
      const profileList = (res as any).resultList || [];

      // Fetch full details for each profile to get description
      const profilesWithDetails = await Promise.all(
        profileList.map(async (profile: any) => {
          try {
            const fullProfile = (await getCsDeviceProfile(profile.id)) as any;
            return {
              ...profile,
              description: fullProfile.deviceProfile?.description || "",
              region: fullProfile.deviceProfile?.region || profile.region,
            };
          } catch (error) {
            console.warn(
              `Failed to fetch details for profile ${profile.id}:`,
              error
            );
            return profile; // Return original profile if fetch fails
          }
        })
      );

      setProfiles(profilesWithDetails);
    } catch (e: any) {
      setError(e?.message || "Failed to load device profiles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrgs();
  }, []);

  useEffect(() => {
    if (selectedOrg) loadProfiles(selectedOrg);
  }, [selectedOrg]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      await createCsDeviceProfile({
        name: newName,
        tenantId: selectedOrg,
        description: newDescription || undefined,
        region: newRegion || undefined,
      });
      setNewName("");
      setNewDescription("");
      setNewRegion("");
      await loadProfiles(selectedOrg);
    } catch (e: any) {
      setError(e?.message || "Failed to create device profile");
    }
  }

  function handleEdit(profile: DeviceProfileItem) {
    setEditingProfile(profile);
    setEditName(profile.name || "");
    setEditDescription(profile.description || "");
    setEditRegion(getRegionName(profile.region));
    setIsEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingProfile) return;
    try {
      await updateCsDeviceProfile(editingProfile.id, {
        name: editName,
        description: editDescription || undefined,
        region: editRegion || undefined,
      });
      await loadProfiles(selectedOrg);
      setIsEditDialogOpen(false);
      setEditingProfile(null);
    } catch (e: any) {
      setError(e?.message || "Failed to update device profile");
    }
  }

  async function handleDelete(profile: DeviceProfileItem) {
    try {
      await deleteCsDeviceProfile(profile.id);
      await loadProfiles(selectedOrg);
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
              Manage device profiles for your LoRaWAN devices
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
              Select an organization and create a new device profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="organization-select" className="mb-2">
                    Organization
                  </Label>
                  <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                    <SelectTrigger
                      id="organization-select"
                      className="min-w-[260px]"
                    >
                      <SelectValue placeholder="Select organization..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {o.name || o.id}
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
                      disabled={!selectedOrg}
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
              {selectedOrg
                ? "Device profiles in the selected organization"
                : "Select an organization to view device profiles"}
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
                      <TableHead>Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {selectedOrg
                            ? "No device profiles found"
                            : "Select an organization to view device profiles"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-sm">
                            {p.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {p.name}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {getRegionName(p.region)}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.description || "No description"}
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
                                      Are you sure you want to delete "{p.name}
                                      "? This action cannot be undone.
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
                      ))
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
                Update the device profile information
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
                />
              </div>
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
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter profile description"
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
