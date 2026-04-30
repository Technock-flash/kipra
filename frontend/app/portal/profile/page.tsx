'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ProfileForm {
  phone: string;
  phoneSecondary: string;
  address: string;
  city: string;
  country: string;
  emergencyName: string;
  emergencyPhone: string;
}

const initialForm: ProfileForm = {
  phone: '',
  phoneSecondary: '',
  address: '',
  city: '',
  country: '',
  emergencyName: '',
  emergencyPhone: '',
};

export default function PortalProfilePage() {
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/portal/profile');
        const data = response.data.data;
        setForm({
          phone: data.phone ?? '',
          phoneSecondary: data.phoneSecondary ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          country: data.country ?? '',
          emergencyName: data.emergencyName ?? '',
          emergencyPhone: data.emergencyPhone ?? '',
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.patch('/portal/profile', form);
      setMessage('Profile updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading profile...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSave}>
          <div className="space-y-2">
            <Label htmlFor="phone">Primary Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneSecondary">Secondary Phone</Label>
            <Input
              id="phoneSecondary"
              value={form.phoneSecondary}
              onChange={(e) => setForm((p) => ({ ...p, phoneSecondary: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Emergency Contact Name</Label>
            <Input
              id="emergencyName"
              value={form.emergencyName}
              onChange={(e) => setForm((p) => ({ ...p, emergencyName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
            <Input
              id="emergencyPhone"
              value={form.emergencyPhone}
              onChange={(e) => setForm((p) => ({ ...p, emergencyPhone: e.target.value }))}
            />
          </div>
          {error && <p className="md:col-span-2 text-sm text-red-500">{error}</p>}
          {message && <p className="md:col-span-2 text-sm text-emerald-600">{message}</p>}
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
