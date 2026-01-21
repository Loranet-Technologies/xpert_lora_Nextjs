'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { old_password: string; new_password: string; logout_all_sessions: number }) => void;
  isLoading?: boolean;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
    logout_all_sessions: 0,
  });
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, new_password: value });
    
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
    } else if (value === formData.old_password) {
      setPasswordError('New password must be different from old password');
    } else {
      setPasswordError('');
    }

    // Check if passwords match
    if (formData.confirm_password && value !== formData.confirm_password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormData({ ...formData, confirm_password: value });
    
    if (value !== formData.new_password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.old_password) {
      return;
    }
    
    if (!formData.new_password) {
      setPasswordError('New password is required');
      return;
    }
    
    if (formData.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.new_password === formData.old_password) {
      setPasswordError('New password must be different from old password');
      return;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    onSubmit({
      old_password: formData.old_password,
      new_password: formData.new_password,
      logout_all_sessions: formData.logout_all_sessions,
    });
  };

  const handleClose = () => {
    setFormData({
      old_password: '',
      new_password: '',
      confirm_password: '',
      logout_all_sessions: 0,
    });
    setPasswordError('');
    setConfirmPasswordError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="old_password">Current Password</Label>
            <Input
              id="old_password"
              type="password"
              value={formData.old_password}
              onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
              required
              placeholder="Enter your current password"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              value={formData.new_password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              disabled={isLoading}
            />
            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {passwordError}
              </p>
            )}
            {!passwordError && formData.new_password && formData.new_password.length >= 8 && formData.new_password !== formData.old_password && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Password is valid
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter new password"
              disabled={isLoading}
            />
            {confirmPasswordError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {confirmPasswordError}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="logout_all_sessions"
              checked={formData.logout_all_sessions === 1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  logout_all_sessions: e.target.checked ? 1 : 0,
                })
              }
              disabled={isLoading}
              className="rounded border-gray-300"
            />
            <Label htmlFor="logout_all_sessions" className="text-sm font-normal cursor-pointer">
              Logout all other sessions
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !!passwordError || !!confirmPasswordError || !formData.old_password || !formData.new_password || !formData.confirm_password}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
