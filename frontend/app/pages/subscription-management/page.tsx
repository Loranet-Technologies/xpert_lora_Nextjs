"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Header from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  type SubscriptionPlan,
} from "@/lib/api/subscription/subscription";

function SubscriptionManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    plan_name: "",
    billing_interval: "Monthly" as "Monthly" | "Yearly",
    max_devices: "",
    included_data_mb: "",
    included_messages: "",
    overage_rate_per_mb: "",
    overage_rate_per_1k_messages: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSubscriptionPlans();
      setPlans(response.data || []);
    } catch (err: any) {
      console.error("Failed to load plans:", err);
      setError(err?.message || "Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      plan_name: "",
      billing_interval: "Monthly",
      max_devices: "",
      included_data_mb: "",
      included_messages: "",
      overage_rate_per_mb: "",
      overage_rate_per_1k_messages: "",
    });
    setShowDialog(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      billing_interval: plan.billing_interval,
      max_devices: plan.max_devices.toString(),
      included_data_mb: plan.included_data_mb.toString(),
      included_messages: plan.included_messages.toString(),
      overage_rate_per_mb: plan.overage_rate_per_mb.toString(),
      overage_rate_per_1k_messages:
        plan.overage_rate_per_1k_messages.toString(),
    });
    setShowDialog(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this subscription plan?")) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeletePlanId(planId);
      setError(null);
      await deleteSubscriptionPlan(planId);
      setSuccess("Subscription plan deleted successfully");
      await loadPlans();
    } catch (err: any) {
      console.error("Failed to delete plan:", err);
      setError(err?.message || "Failed to delete subscription plan");
    } finally {
      setIsDeleting(false);
      setDeletePlanId(null);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!formData.plan_name.trim()) {
        setError("Plan name is required");
        return;
      }
      if (!formData.max_devices || parseInt(formData.max_devices) <= 0) {
        setError("Max devices must be greater than 0");
        return;
      }
      if (
        !formData.included_data_mb ||
        parseFloat(formData.included_data_mb) < 0
      ) {
        setError("Included data must be 0 or greater");
        return;
      }
      if (
        !formData.included_messages ||
        parseInt(formData.included_messages) < 0
      ) {
        setError("Included messages must be 0 or greater");
        return;
      }

      const submitData: any = {
        plan_name: formData.plan_name.trim(),
        billing_interval: formData.billing_interval,
        max_devices: parseInt(formData.max_devices),
        included_data_mb: parseFloat(formData.included_data_mb),
        included_messages: parseInt(formData.included_messages),
      };

      if (formData.overage_rate_per_mb) {
        submitData.overage_rate_per_mb = parseFloat(
          formData.overage_rate_per_mb
        );
      }
      if (formData.overage_rate_per_1k_messages) {
        submitData.overage_rate_per_1k_messages = parseFloat(
          formData.overage_rate_per_1k_messages
        );
      }

      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.name, submitData);
        setSuccess("Subscription plan updated successfully");
      } else {
        await createSubscriptionPlan(submitData);
        setSuccess("Subscription plan created successfully");
      }

      setShowDialog(false);
      await loadPlans();
    } catch (err: any) {
      console.error("Failed to save plan:", err);
      setError(err?.message || "Failed to save subscription plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Subscription Management
                </h1>
                <p className="text-muted-foreground">
                  Create, view, update, and delete subscription plans
                </p>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Plans Table */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>
                  Manage all subscription plans in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No subscription plans found. Create one to get started.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan Name</TableHead>
                          <TableHead>Billing Interval</TableHead>
                          <TableHead>Max Devices</TableHead>
                          <TableHead>Included Messages</TableHead>
                          <TableHead>Included Data (MB)</TableHead>
                          <TableHead>Overage Rates</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.map((plan) => (
                          <TableRow key={plan.name}>
                            <TableCell className="font-medium">
                              {plan.plan_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {plan.billing_interval}
                              </Badge>
                            </TableCell>
                            <TableCell>{plan.max_devices}</TableCell>
                            <TableCell>
                              {plan.included_messages.toLocaleString()}
                            </TableCell>
                            <TableCell>{plan.included_data_mb}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <div>
                                {plan.overage_rate_per_mb > 0 && (
                                  <div>RM {plan.overage_rate_per_mb}/MB</div>
                                )}
                                {plan.overage_rate_per_1k_messages > 0 && (
                                  <div>
                                    RM {plan.overage_rate_per_1k_messages}/1K
                                    msgs
                                  </div>
                                )}
                                {plan.overage_rate_per_mb === 0 &&
                                  plan.overage_rate_per_1k_messages === 0 && (
                                    <span className="text-muted-foreground">
                                      No overage
                                    </span>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(plan)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(plan.name)}
                                  disabled={
                                    isDeleting && deletePlanId === plan.name
                                  }
                                >
                                  {isDeleting && deletePlanId === plan.name ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan
                  ? "Edit Subscription Plan"
                  : "Create Subscription Plan"}
              </DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? "Update the subscription plan details below."
                  : "Fill in the details to create a new subscription plan."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan_name">Plan Name *</Label>
                <Input
                  id="plan_name"
                  value={formData.plan_name}
                  onChange={(e) =>
                    setFormData({ ...formData, plan_name: e.target.value })
                  }
                  placeholder="e.g., Personal Basic, Starter SME"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_interval">Billing Interval *</Label>
                <Select
                  value={formData.billing_interval}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      billing_interval: value as "Monthly" | "Yearly",
                    })
                  }
                >
                  <SelectTrigger id="billing_interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_devices">Max Devices *</Label>
                  <Input
                    id="max_devices"
                    type="number"
                    min="1"
                    value={formData.max_devices}
                    onChange={(e) =>
                      setFormData({ ...formData, max_devices: e.target.value })
                    }
                    placeholder="e.g., 10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="included_data_mb">Included Data (MB) *</Label>
                  <Input
                    id="included_data_mb"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.included_data_mb}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        included_data_mb: e.target.value,
                      })
                    }
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="included_messages">Included Messages *</Label>
                <Input
                  id="included_messages"
                  type="number"
                  min="0"
                  value={formData.included_messages}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      included_messages: e.target.value,
                    })
                  }
                  placeholder="e.g., 10000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overage_rate_per_mb">
                    Overage Rate per MB (RM)
                  </Label>
                  <Input
                    id="overage_rate_per_mb"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.overage_rate_per_mb}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overage_rate_per_mb: e.target.value,
                      })
                    }
                    placeholder="e.g., 0.10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overage_rate_per_1k_messages">
                    Overage Rate per 1K Messages (RM)
                  </Label>
                  <Input
                    id="overage_rate_per_1k_messages"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.overage_rate_per_1k_messages}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overage_rate_per_1k_messages: e.target.value,
                      })
                    }
                    placeholder="e.g., 5.00"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setError(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default SubscriptionManagement;
