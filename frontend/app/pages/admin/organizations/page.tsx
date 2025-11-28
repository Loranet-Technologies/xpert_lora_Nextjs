"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Org = {
  id: string;
  name?: string;
  createdAt?: { seconds: number; nanos: number };
  updatedAt?: { seconds: number; nanos: number };
  canHaveGateways?: boolean;
  maxGatewayCount?: number;
  maxDeviceCount?: number;
} & Record<string, any>;

// Helper function to format ChirpStack timestamp
function formatChirpStackDate(timestamp?: {
  seconds: number;
  nanos: number;
}): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

export default function OrganizationsAdminPage() {
  const [items, setItems] = useState<Org[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingOrg, setEditingOrg] = useState<Org | null>(null);
  const [editName, setEditName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const res = await listOrganizations({ limit: 50 });
      // ChirpStack list returns { totalCount, resultList }
      const data = (res as any).resultList || [];
      setItems(data as Org[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createOrganization({ name: newName });
      setNewName("");
      await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to create organization");
    }
  }

  async function onUpdate(id: string, updates: { name?: string }) {
    try {
      await updateOrganization(id, updates);
      setIsEditDialogOpen(false);
      setEditingOrg(null);
      await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to update organization");
    }
  }

  function openEditDialog(org: Org) {
    setEditingOrg(org);
    setEditName(org.name || "");
    setIsEditDialogOpen(true);
  }

  async function onDelete(id: string) {
    if (!confirm("Delete organization?")) return;
    try {
      await deleteOrganization(id);
      await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to delete organization");
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground">
              Manage and organize your company structures
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Organization
            </CardTitle>
            <CardDescription>
              Add a new organization to your system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onCreate}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  placeholder="Enter organization name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Organizations List</CardTitle>
            <CardDescription>
              {items.length} organization{items.length !== 1 ? "s" : ""} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading organizations...</span>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Gateways</TableHead>
                      <TableHead>Max Devices</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-sm">
                          <Badge variant="outline">
                            {o.id?.substring(0, 8)}...
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {o.name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatChirpStackDate(o.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              o.canHaveGateways ? "default" : "secondary"
                            }
                          >
                            {o.canHaveGateways ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {o.maxDeviceCount === 0
                            ? "Unlimited"
                            : o.maxDeviceCount}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(o)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(o.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && !loading && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No organizations found. Create your first organization
                          above.
                        </TableCell>
                      </TableRow>
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
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>
                Update the organization details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Organization Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter organization name"
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
              <Button
                onClick={() =>
                  editingOrg &&
                  onUpdate(editingOrg.id, {
                    name: editName,
                  })
                }
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
