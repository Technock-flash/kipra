'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { GalleryAuthenticatedImage } from '@/components/gallery/GalleryAuthenticatedImage';
import { Card, CardContent } from '@/components/ui/card';
import type { GalleryItem } from '@/types/gallery';

export default function PortalGalleryPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission('gallery:read');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (!canView) {
    return (
      <p className="text-sm text-muted-foreground">You do not have access to the church gallery.</p>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Photos from church events and services.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-video w-full bg-muted">
              <GalleryAuthenticatedImage id={item.id} alt={item.caption ?? item.originalName} className="rounded-none" />
            </div>
            <CardContent className="p-3">
              {item.caption ? <p className="text-sm font-medium">{item.caption}</p> : null}
              <p className="text-xs text-muted-foreground truncate">{item.originalName}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!items.length ? <p className="text-sm text-muted-foreground">No photos published yet.</p> : null}
    </div>
  );
}
