'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  user?: any;
  mode?: 'create' | 'edit';
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  mode = 'create',
}: UserFormModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: '',
    password: '',
    enabled: 1,
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || 'User', // Default to 'User' if role is null/undefined
        password: '', // Don't show password in edit mode
        enabled: user.enabled !== undefined ? user.enabled : 1,
      });
    } else {
      setFormData({
        email: '',
        full_name: '',
        role: 'User', // Default to 'User' for new users
        password: '',
        enabled: 1,
      });
    }
    setPasswordError(''); // Reset password error when modal opens/closes
  }, [user, mode, isOpen]);

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    // Validate password length
    if (value && value.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password for create mode
    if (mode === 'create') {
      if (!formData.password) {
        setPasswordError('Password is required');
        return;
      }
      if (formData.password.length < 8) {
        setPasswordError('Password must be at least 8 characters long');
        return;
      }
    }
    
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add User' : 'Edit User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
          {mode === 'create' && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
              />
              {passwordError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {passwordError}
                </p>
              )}
              {!passwordError && formData.password && formData.password.length >= 8 && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Password is valid
                </p>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="enabled">Status</Label>
            <Select
              value={String(formData.enabled)}
              onValueChange={(value) => setFormData({ ...formData, enabled: Number(value) })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === 'create' ? 'Create' : 'Update'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
