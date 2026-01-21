'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Settings,
  Trash2,
  Download,
  Plus,
  UserPlus,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Key,
  KeyRound,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/header';
import { DataTable } from '@/components/data-table';
import { UserFormModal } from '@/components/user/user-form-modal';
import { DeleteConfirmationModal } from '@/components/user/delete-confirmation-modal';
import { ResetPasswordModal } from '@/components/user/reset-password-modal';
import { ChangePasswordModal } from '@/components/user/change-password-modal';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  changePassword,
  type UserDetail,
} from '@/lib/api/user/user';

const getRoleBadgeColor = (role: string | null | undefined) => {
  if (!role) {
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
  const roleLower = role.toLowerCase();
  switch (roleLower) {
    case 'superadmin':
    case 'super admin':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case 'admin':
    case 'organization_admin':
    case 'shop_admin':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'user':
    case 'developer':
    case 'viewer':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

const getStatusBadgeColor = (status: string | null | undefined) => {
  if (!status) {
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
  switch (status.toLowerCase()) {
    case 'active':
    case 'success':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'inactive':
    case 'error':
    case 'failed':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

export default function Users() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if current user is admin or superadmin
  const currentUserRole = user?.role?.toLowerCase() || '';
  const canResetPassword = currentUserRole === 'admin' || currentUserRole === 'superadmin';
  
  // Pagination and search state
  const [page, setPage] = useState(1);
  const [pageLength] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Fetch users with React Query
  const {
    data: usersResponse,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['users', page, pageLength, searchTerm],
    queryFn: () => listUsers({ 
      page, 
      page_length: pageLength, 
      search_term: searchTerm || undefined 
    }),
    retry: 1,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'User created successfully');
      if (data.password) {
        toast.info(`Password: ${data.password}`, { duration: 10000 });
      }
      setIsUserModalOpen(false);
    },
    onError: (error: Error) => {
      // Extract clear error message - the backend now returns structured errors
      const errorMessage = error.message || 'Failed to create user';
      toast.error(errorMessage, { 
        duration: 6000, // Show longer for validation errors
        description: 'Please check the form and try again'
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userName, userData }: { userName: string; userData: any }) =>
      updateUser(userName, userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'User updated successfully');
      setIsUserModalOpen(false);
    },
    onError: (error: Error) => {
      // Extract clear error message
      const errorMessage = error.message || 'Failed to update user';
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'User deleted successfully');
      setIsDeleteModalOpen(false);
    },
    onError: (error: Error) => {
      // Extract clear error message
      const errorMessage = error.message || 'Failed to delete user';
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'Password reset successfully');
      setIsResetPasswordModalOpen(false);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to reset password';
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast.success(data.message || 'Password changed successfully');
      setIsChangePasswordModalOpen(false);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to change password';
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const usersData = usersResponse?.data || [];
  const totalUsers = usersResponse?.total || 0;
  const totalPages = usersResponse?.total_pages || 1;

  const handleAddUser = () => {
    setModalMode('create');
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: UserDetail) => {
    setModalMode('edit');
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteClick = (user: UserDetail) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleResetPasswordClick = (user: UserDetail) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
  };

  const handleChangePasswordClick = () => {
    setIsChangePasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = (data: {
    target_user_name: string;
    new_password: string;
    logout_all_sessions: number;
  }) => {
    resetPasswordMutation.mutate(data);
  };

  const handleChangePasswordSubmit = (data: {
    old_password: string;
    new_password: string;
    logout_all_sessions: number;
  }) => {
    changePasswordMutation.mutate(data);
  };

  const handleUserSubmit = (userData: any) => {
    if (modalMode === 'create') {
      // Extract first_name from full_name (split by space, first part is first_name)
      const nameParts = userData.full_name?.trim().split(/\s+/) || [];
      const first_name = nameParts[0] || '';
      const last_name =
        nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Validate password
      if (!userData.password) {
        toast.error('Password is required');
        return;
      }
      if (userData.password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }

      createUserMutation.mutate({
        email: userData.email,
        first_name: first_name || userData.full_name,
        last_name: last_name || undefined,
        role: userData.role, // Already in correct format (SuperAdmin, Admin, User)
        password: userData.password, // Include password
        enabled: userData.enabled,
        username: userData.email.split('@')[0],
      });
    } else if (selectedUser) {
      // Extract first_name from full_name for update
      const nameParts = userData.full_name?.trim().split(/\s+/) || [];
      const first_name =
        nameParts[0] || userData.first_name || selectedUser.first_name || '';
      const last_name =
        nameParts.length > 1
          ? nameParts.slice(1).join(' ')
          : userData.last_name || selectedUser.last_name || undefined;

      updateUserMutation.mutate({
        userName: selectedUser.name,
        userData: {
          email: userData.email,
          first_name: first_name,
          last_name: last_name,
          role: userData.role, // Already in correct format (SuperAdmin, Admin, User)
          enabled: userData.enabled,
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.name);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page on search
  };

  // Export users to CSV
  const handleExportUsers = () => {
    if (!usersData || usersData.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Define CSV headers
    const headers = ['Email', 'Full Name', 'Role', 'Status'];
    
    // Convert data to CSV rows
    const csvRows = [
      headers.join(','),
      ...usersData.map((user: UserDetail) => {
        const status = user.enabled === 1 ? 'active' : 'inactive';
        return [
          user.email || '',
          user.full_name || '',
          user.role || '',
          status,
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(',');
      }),
    ];

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Users exported successfully');
  };

  // Filter users (client-side filtering for role and status)
  const filteredUsers =
    usersData?.filter((user) => {
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.enabled === 1) ||
        (statusFilter === 'inactive' && user.enabled === 0);
      return roleMatch && statusMatch;
    }) || [];

  const uniqueRoles = [...new Set(usersData?.map((user) => user.role) || [])];

  const columns = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'full_name',
      header: 'Full Name',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }: { row: { original: UserDetail; getValue: (key: string) => any } }) => {
        const role = row.getValue('role') as string | null | undefined;
        return (
          <Badge className={cn('text-xs', getRoleBadgeColor(role))}>
            {role || 'N/A'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'enabled',
      header: 'Status',
      cell: ({ row }: { row: { original: UserDetail; getValue: (key: string) => any } }) => {
        const enabled = row.getValue('enabled') as number;
        const status = enabled === 1 ? 'active' : 'inactive';
        return (
          <Badge className={cn('text-xs', getStatusBadgeColor(status))}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: UserDetail; getValue: (key: string) => any } }) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer"
            onClick={() => handleEditUser(row.original)}
            title="Edit user">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </Button>
          {canResetPassword && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer"
              onClick={() => handleResetPasswordClick(row.original)}
              disabled={resetPasswordMutation.isPending}
              title="Reset password">
              <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
            onClick={() => handleDeleteClick(row.original)}
            disabled={deleteUserMutation.isPending}
            title="Delete user">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Users" />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-6xl space-y-4">
            {/* Users Table */}
            <Card className="border-0 overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="@container/main flex flex-1 flex-col gap-2">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select
                          value={roleFilter}
                          onValueChange={setRoleFilter}>
                          <SelectTrigger className="w-auto">
                            <SelectValue placeholder="Filter by role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {uniqueRoles.map((role: string) => (
                              <SelectItem key={String(role)} value={String(role)}>
                                {String(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-auto">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs sm:text-sm bg-transparent w-auto"
                          onClick={handleChangePasswordClick}
                          disabled={changePasswordMutation.isPending}>
                          {changePasswordMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                          ) : (
                            <KeyRound className="w-4 h-4 mr-1 sm:mr-2" />
                          )}
                          <span className="hidden sm:inline">Change My Password</span>
                          <span className="sm:hidden">Password</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs sm:text-sm bg-transparent w-auto"
                          onClick={handleExportUsers}>
                          <Download className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Export</span>
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-auto"
                          onClick={handleAddUser}
                          disabled={createUserMutation.isPending}>
                          {createUserMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                          )}
                          <span className="hidden sm:inline">Add User</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>
                    </div>

                    {usersLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading users...</span>
                      </div>
                    )}
                    {usersError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                        <div className="text-red-800 dark:text-red-200 font-medium mb-1">
                          Error loading users
                        </div>
                        <div className="text-red-600 dark:text-red-400 text-sm">
                          {usersError instanceof Error ? usersError.message : 'Failed to load users'}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
                          Retry
                        </Button>
                      </div>
                    )}
                    {!usersLoading && !usersError && (
                      <>
                        <DataTable
                          data={filteredUsers}
                          columns={columns}
                        />
                        {usersData.length === 0 && !searchTerm && (
                          <div className="text-center py-8 text-muted-foreground border-t pt-4">
                            <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="font-medium">No users found</p>
                            <p className="text-sm mt-1">Click "Add User" to create your first user</p>
                          </div>
                        )}
                      </>
                    )}

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((page - 1) * pageLength) + 1} to {Math.min(page * pageLength, totalUsers)} of {totalUsers} users
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || usersLoading}>
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <div className="text-sm">
                            Page {page} of {totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || usersLoading}>
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <UserFormModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          onSubmit={handleUserSubmit}
          user={selectedUser}
          mode={modalMode}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          user={selectedUser}
        />

        <ResetPasswordModal
          isOpen={isResetPasswordModalOpen}
          onClose={() => setIsResetPasswordModalOpen(false)}
          onSubmit={handleResetPasswordSubmit}
          user={selectedUser}
          isLoading={resetPasswordMutation.isPending}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSubmit={handleChangePasswordSubmit}
          isLoading={changePasswordMutation.isPending}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
