"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { useAuth } from "@/lib/auth/AuthProvider";
import { changePassword, updateUser } from "@/lib/api/user/user";
import { BASE_URLS } from "@/lib/config/api.config";
import { Camera, Database, KeyRound, Lock, Pencil, User } from "lucide-react";
import { toast } from "sonner";
import { ChangePasswordModal } from "@/components/user/change-password-modal";

type UserDetailsPayload = {
  name?: string;
  creation?: string;
  modified?: string;
  role?: string;
  email?: string;
  enabled?: number;
  user_image?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  username?: string;
  time_zone?: string;
  last_login?: string;
  last_active?: string;
};

function SettingsPageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-9">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4">
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border p-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-2 h-4 w-72" />
              <Skeleton className="mt-4 h-10 w-40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md md:col-span-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetailsPayload | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    username: "",
    user_image: "",
    role: "",
    enabled: 1,
  });

  const fetchUserDetails = useCallback(async () => {
    const username = user?.username;
    if (!username || !token) return;

    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const response = await fetch(
        `/api/erpnext/user-details?username=${encodeURIComponent(username)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load account details");
      }

      const json = await response.json();
      const details = (json?.data ?? json) as UserDetailsPayload;
      setUserDetails(details);
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : "Failed to load account details",
      );
    } finally {
      setDetailsLoading(false);
    }
  }, [user?.username, token]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const vaultUuid = useMemo(() => {
    return (
      userDetails?.name || user?.username || user?.id || user?.email || "N/A"
    );
  }, [userDetails?.name, user?.username, user?.id, user?.email]);

  const registrationDate = useMemo(() => {
    if (!userDetails?.creation) return null;
    const parsed = new Date(userDetails.creation);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }, [userDetails?.creation]);

  const profileFullName =
    userDetails?.full_name ||
    [userDetails?.first_name, userDetails?.last_name]
      .filter(Boolean)
      .join(" ") ||
    user?.firstName ||
    "N/A";
  const profileEmail = userDetails?.email || user?.email || "N/A";
  const profileRole = userDetails?.role || user?.role || "N/A";
  const profileUsername = userDetails?.username || user?.username || "N/A";
  const profileTimeZone = userDetails?.time_zone || "N/A";
  const readOnlyFieldClass = !isEditingProfile ? "bg-muted/40" : "";
  const showInitialSkeleton = detailsLoading && !userDetails && !detailsError;

  const resolvedUserImage = useMemo(() => {
    const raw = (profileForm.user_image || userDetails?.user_image || "").trim();
    if (!raw) return "";
    if (raw.startsWith("data:image/")) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/")) return `${BASE_URLS.ERPNEXT}${raw}`;
    return `${BASE_URLS.ERPNEXT}/${raw}`;
  }, [profileForm.user_image, userDetails?.user_image]);

  useEffect(() => {
    if (!userDetails) return;
    setProfileForm({
      full_name:
        userDetails.full_name ||
        [userDetails.first_name, userDetails.last_name]
          .filter(Boolean)
          .join(" "),
      email: userDetails.email || "",
      username: userDetails.username || "",
      user_image: userDetails.user_image || "",
      role: userDetails.role || "User",
      enabled:
        typeof userDetails.enabled === "number" ? userDetails.enabled : 1,
    });
  }, [userDetails]);

  const avatarInitials = useMemo(() => {
    const name = profileFullName?.trim();
    if (!name || name === "N/A") return "U";
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
  }, [profileFullName]);

  const formatDateTime = (value?: string) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const handleUpdateProfile = async (userData: {
    email: string;
    full_name: string;
    username: string;
    user_image: string;
    enabled: number;
  }) => {
    if (!userDetails?.name) {
      toast.error("User profile is not loaded yet");
      return;
    }

    const nameParts = userData.full_name?.trim().split(/\s+/) || [];
    const first_name = nameParts[0] || "";
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    try {
      setIsUpdatingProfile(true);
      const payload: Record<string, unknown> = {
        email: userData.email,
        first_name,
        last_name: last_name || undefined,
        username: userData.username,
        user_image: userData.user_image || "",
        role: userDetails.role,
        enabled: userData.enabled,
      };
      await updateUser(
        userDetails.name,
        payload as Parameters<typeof updateUser>[1],
      );
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
      await fetchUserDetails();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCancelProfileEdit = () => {
    if (!userDetails) return;
    setProfileForm({
      full_name:
        userDetails.full_name ||
        [userDetails.first_name, userDetails.last_name]
          .filter(Boolean)
          .join(" "),
      email: userDetails.email || "",
      username: userDetails.username || "",
      user_image: userDetails.user_image || "",
      role: userDetails.role || "User",
      enabled:
        typeof userDetails.enabled === "number" ? userDetails.enabled : 1,
    });
    setIsEditingProfile(false);
  };

  const handlePickImage = () => {
    if (
      !isEditingProfile ||
      detailsLoading ||
      !userDetails ||
      isUpdatingProfile
    ) {
      return;
    }
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setProfileForm((prev) => ({
          ...prev,
          user_image: result,
        }));
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleChangePasswordSubmit = async (data: {
    old_password: string;
    new_password: string;
    logout_all_sessions: number;
  }) => {
    try {
      setIsChangingPassword(true);
      const response = await changePassword(data);
      toast.success(response.message || "Password changed successfully");
      setIsChangePasswordModalOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Settings" />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                System Settings
              </h1>
              <p className="text-muted-foreground">
                Manage profile, security, account details, and user management.
              </p>
            </div>

            {showInitialSkeleton ? (
              <SettingsPageSkeleton />
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-9">
                  <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      User Profile
                    </CardTitle>
                    <CardDescription>
                      Review and update your account details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start">
                      <div className="relative">
                        <Avatar
                          className={`h-20 w-20 ring-2 ring-border shadow-sm ${
                            isEditingProfile ? "cursor-pointer" : ""
                          }`}
                          onClick={handlePickImage}
                        >
                          <AvatarImage
                            src={resolvedUserImage}
                            alt={profileFullName}
                            className="object-cover"
                          />
                          <AvatarFallback>{avatarInitials}</AvatarFallback>
                        </Avatar>
                        {isEditingProfile && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePickImage();
                            }}
                            aria-label="Change profile image"
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={profileForm.full_name}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                full_name: e.target.value,
                              }))
                            }
                            readOnly={!isEditingProfile}
                            disabled={
                              detailsLoading ||
                              !userDetails ||
                              isUpdatingProfile
                            }
                            className={readOnlyFieldClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Input
                            id="role"
                            value={profileRole}
                            readOnly
                            className="bg-muted/40"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="emailAddress">Email Address</Label>
                          <Input
                            id="emailAddress"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            readOnly={!isEditingProfile}
                            disabled={
                              detailsLoading ||
                              !userDetails ||
                              isUpdatingProfile
                            }
                            className={readOnlyFieldClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={profileForm.username}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                username: e.target.value,
                              }))
                            }
                            readOnly={!isEditingProfile}
                            disabled={
                              detailsLoading ||
                              !userDetails ||
                              isUpdatingProfile
                            }
                            className={readOnlyFieldClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Time Zone</Label>
                          <Input
                            id="timezone"
                            value={profileTimeZone}
                            readOnly
                            className="bg-muted/40"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t pt-4">
                      {!isEditingProfile ? (
                        <Button
                          onClick={() => setIsEditingProfile(true)}
                          disabled={
                            detailsLoading || !userDetails || isUpdatingProfile
                          }
                        >
                          Update
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={handleCancelProfileEdit}
                            disabled={
                              detailsLoading ||
                              !userDetails ||
                              isUpdatingProfile
                            }
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() =>
                              void handleUpdateProfile(profileForm)
                            }
                            disabled={
                              detailsLoading ||
                              !userDetails ||
                              isUpdatingProfile
                            }
                          >
                            {isUpdatingProfile ? "Saving..." : "Save"}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-600" />
                      Security
                    </CardTitle>
                    <CardDescription>
                      Authentication and hardening options.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">Authentication Protocol</p>
                        <p className="text-sm text-muted-foreground">
                          Update your account password and encryption keys.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        disabled={isChangingPassword}
                      >
                        <KeyRound className="mr-2 h-4 w-4" />
                        Change Password
                      </Button>
                    </div>
                    <ChangePasswordModal
                      isOpen={isChangePasswordModalOpen}
                      onClose={() => setIsChangePasswordModalOpen(false)}
                      onSubmit={handleChangePasswordSubmit}
                      isLoading={isChangingPassword}
                    />
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 rounded-md border p-4">
                      <p className="text-sm text-muted-foreground">
                        Registration Date
                      </p>
                      {detailsLoading ? (
                        <p className="font-medium">Loading...</p>
                      ) : detailsError ? (
                        <p className="font-medium text-red-600">
                          {detailsError}
                        </p>
                      ) : registrationDate ? (
                        <>
                          <p className="font-medium">
                            {registrationDate.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {registrationDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            })}
                          </p>
                        </>
                      ) : (
                        <p className="font-medium">N/A</p>
                      )}
                    </div>
                    <div className="space-y-2 rounded-md border p-4">
                      <p className="text-sm text-muted-foreground">
                        Last Login
                      </p>
                      <p className="font-medium">
                        {formatDateTime(userDetails?.last_login)}
                      </p>
                    </div>
                    <div className="space-y-2 rounded-md border p-4">
                      <p className="text-sm text-muted-foreground">
                        Last Active
                      </p>
                      <p className="font-medium">
                        {formatDateTime(userDetails?.last_active)}
                      </p>
                    </div>
                    <div className="space-y-2 rounded-md border p-4 md:col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Last Modified
                      </p>
                      <p className="font-medium">
                        {formatDateTime(userDetails?.modified)}
                      </p>
                    </div>
                  </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
