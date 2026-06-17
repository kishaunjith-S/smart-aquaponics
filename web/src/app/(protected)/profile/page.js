'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            {/* Placeholder for profile image */}
            <div className="h-20 w-20 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-2xl font-bold">
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.fullName || 'User Name'}</p>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="profile-image">Profile Image</Label>
            <Input id="profile-image" type="file" />
            <p className="text-sm text-muted-foreground mt-2">.jpg, .png, .gif</p>
          </div>

          <Button variant="destructive" onClick={logout}>
            Log Out
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
