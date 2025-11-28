"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  listOrganizations,
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
import { Loader2, Plus, Edit, Trash2, Building2, Zap } from "lucide-react";

type OrgItem = { id: string; name?: string };
type AppItem = { id: string; name?: string };

export default function ApplicationsAdminPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [editName, setEditName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  async function loadOrgs() {
    const res = await listOrganizations({ limit: 100 });
    setOrgs((res as any).resultList || []);
  }

  async function loadApps(tenantId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await listCsApplications({ organizationId: tenantId });
      setApps((res as any).resultList || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrgs();
  }, []);

  useEffect(() => {
    if (selectedOrg) loadApps(selectedOrg);
  }, [selectedOrg]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      await createCsApplication({ name: newName, organizationId: selectedOrg });
      setNewName("");
      await loadApps(selectedOrg);
    } catch (e: any) {
      setError(e?.message || "Failed to create application");
    }
  }

  function handleEdit(app: AppItem) {
    setEditingApp(app);
    setEditName(app.name || "");
    setIsEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingApp) return;
    try {
      await updateCsApplication(editingApp.id, { name: editName });
      await loadApps(selectedOrg);
      setIsEditDialogOpen(false);
      setEditingApp(null);
    } catch (e: any) {
      setError(e?.message || "Failed to update application");
    }
  }

  async function handleDelete(app: AppItem) {
    try {
      await deleteCsApplication(app.id);
      await loadApps(selectedOrg);
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
              Manage applications within your organizations
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
              Select an organization and create a new application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="organization-select" className="mb-2 ">
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
                    disabled={!selectedOrg}
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
              {selectedOrg
                ? "Applications in the selected organization"
                : "Select an organization to view applications"}
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
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apps.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {selectedOrg
                            ? "No applications found"
                            : "Select an organization to view applications"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      apps.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-sm">
                            {a.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {a.name}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(a)}
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
                                      Are you sure you want to delete "{a.name}
                                      "? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(a)}
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
                Update the name of the application
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
