'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { GalleryAuthenticatedImage } from '@/components/gallery/GalleryAuthenticatedImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Upload } from 'lucide-react';
import type { GalleryItem } from '@/types/gallery';

export default function DashboardGalleryPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission('gallery:read');
  const canManage = hasPermission('gallery:manage');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortDrafts, setSortDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/gallery');
      setItems(res.data.data ?? []);
    } catch {
      setError('Could not load gallery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    load();
  }, [load, canView]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      if (uploadCaption.trim()) form.append('caption', uploadCaption.trim());
      await api.post('/gallery', form);
      setUploadCaption('');
      await load();
    } catch (err) {
      const apiMsg =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object'
          ? (err.response.data as { message?: string }).message
          : undefined;
      setError(
        apiMsg ??
          'Upload failed. Use JPEG, PNG, WebP, or GIF under 10MB.'
      );
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Remove this photo from the gallery?')) return;
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/gallery/${id}`);
      await load();
    } catch {
      setError('Could not delete image.');
    } finally {
      setDeletingId(null);
    }
  };

  const saveSort = async (id: string) => {
    const raw = sortDrafts[id];
    if (raw === undefined) return;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0) {
      setError('Sort order must be a non-negative number.');
      return;
    }
    setError('');
    try {
      await api.patch(`/gallery/${id}`, { sortOrder: n });
      setSortDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await load();
    } catch {
      setError('Could not update sort order.');
    }
  };

  if (!canView) {
    return (
      <p className="text-sm text-muted-foreground">You do not have permission to view the gallery.</p>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Church gallery</h1>
        <p className="text-sm text-muted-foreground">
          Photos visible to members in the portal and to staff here. Only admins can add or remove images.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload image</CardTitle>
            <CardDescription>JPEG, PNG, WebP, or GIF — max 10MB.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="gallery-caption">Caption (optional)</Label>
              <Input
                id="gallery-caption"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="e.g. Easter service 2026"
                maxLength={500}
              />
            </div>
            <div>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="max-w-md cursor-pointer"
                disabled={uploading}
                onChange={onUpload}
              />
              {uploading ? (
                <p className="mt-2 text-sm text-muted-foreground">Uploading…</p>
              ) : (
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  Choose a file to upload immediately.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-video w-full bg-muted">
              <GalleryAuthenticatedImage id={item.id} alt={item.caption ?? item.originalName} className="rounded-none" />
            </div>
            <CardContent className="space-y-3 p-4">
              {item.caption ? <p className="text-sm font-medium">{item.caption}</p> : null}
              <p className="text-xs text-muted-foreground">
                {item.originalName} · {item.uploadedBy.firstName} {item.uploadedBy.lastName}
              </p>
              {canManage ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Order</Label>
                    <Input
                      className="h-8 w-20"
                      type="number"
                      min={0}
                      value={sortDrafts[item.id] ?? String(item.sortOrder)}
                      onChange={(e) =>
                        setSortDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={
                      sortDrafts[item.id] === undefined ||
                      sortDrafts[item.id] === String(item.sortOrder)
                    }
                    onClick={() => saveSort(item.id)}
                  >
                    Save order
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="ml-auto"
                    disabled={deletingId === item.id}
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {!items.length ? (
        <p className="text-sm text-muted-foreground">No photos yet.{canManage ? ' Upload one above.' : ''}</p>
      ) : null}
    </div>
  );
}
