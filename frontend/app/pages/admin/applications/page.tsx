"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  fetchERPNextTenants,
  fetchERPNextApplications,
  listCsApplications,
  createCsApplication,
  updateCsApplication,
  deleteCsApplication,
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
import { Loader2, Plus, Edit, Trash2, Building2, Zap } from "lucide-react";

// ERPNext Tenant type
type Tenant = {
  name: string;
  tenant_name: string;
  chirpstack_id?: string;
} & Record<string, any>;

// ERPNext Application type
type Application = {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  application_name: string;
  tenant: string;
  tenant_chirpstack_id?: string;
  chirpstack_id?: string;
  description?: string;
  metadata?: any;
  status?: string;
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

export default function ApplicationsAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editName, setEditName] = useState("");
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

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      loadApps(selectedTenant);
    } else {
      setApps([]);
    }
  }, [selectedTenant]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      // Note: Creating applications in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the create endpoint
      setError(
        "Create functionality for ERPNext applications not yet implemented"
      );
      // await createCsApplication({ name: newName, organizationId: selectedTenant });
      // setNewName("");
      // await loadApps(selectedTenant);
    } catch (e: any) {
      setError(e?.message || "Failed to create application");
    }
  }

  function handleEdit(app: Application) {
    setEditingApp(app);
    setEditName(app.application_name || "");
    setIsEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingApp) return;
    try {
      // Note: Updating applications in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the update endpoint
      setError(
        "Update functionality for ERPNext applications not yet implemented"
      );
      // await updateCsApplication(editingApp.name, { name: editName });
      // await loadApps(selectedTenant);
      // setIsEditDialogOpen(false);
      // setEditingApp(null);
    } catch (e: any) {
      setError(e?.message || "Failed to update application");
    }
  }

  async function handleDelete(app: Application) {
    try {
      // Note: Deleting applications in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the delete endpoint
      setError(
        "Delete functionality for ERPNext applications not yet implemented"
      );
      // await deleteCsApplication(app.name);
      // await loadApps(selectedTenant);
    } catch (e: any) {
      setError(e?.message || "Failed to delete application");
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
            <p className="text-muted-foreground">
              Manage applications from ERPNext
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Application
            </CardTitle>
            <CardDescription>
              Note: Create functionality for ERPNext applications not yet
              implemented
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="tenant-select" className="mb-2 ">
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
              <form
                onSubmit={onCreate}
                className="flex flex-col sm:flex-row gap-4 flex-1"
              >
                <div className="flex-1">
                  <Label htmlFor="app-name" className="mb-2 ">
                    Application Name
                  </Label>
                  <Input
                    id="app-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter application name"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={!selectedTenant}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Application
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

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              {selectedTenant
                ? `${apps.length} application${
                    apps.length !== 1 ? "s" : ""
                  } from ERPNext`
                : "Select a tenant to view applications"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading applications...
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Application Name</TableHead>
                      <TableHead>ChirpStack ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apps.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {selectedTenant
                            ? "No applications found"
                            : "Select a tenant to view applications"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      apps.map((app) => (
                        <TableRow key={app.name}>
                          <TableCell className="font-mono text-sm">
                            <Badge variant="outline">
                              {app.name?.substring(0, 8)}...
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {app.application_name || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {app.chirpstack_id || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {app.description || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                app.status === "Active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {app.status || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatERPNextDate(app.creation)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(app)}
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
                                      Delete Application
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      {app.application_name || app.name}"? This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(app)}
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
              <DialogTitle>Edit Application</DialogTitle>
              <DialogDescription>
                Update the name of the application (Note: Update functionality
                not yet implemented)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Application Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter application name"
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
