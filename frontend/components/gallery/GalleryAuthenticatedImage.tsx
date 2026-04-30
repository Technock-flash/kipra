'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  alt?: string;
  className?: string;
};

export function GalleryAuthenticatedImage({ id, alt, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const res = await api.get(`/gallery/${id}/file`, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(res.data);
        if (!revoked) setSrc(objectUrl);
      } catch {
        if (!revoked) setFailed(true);
      }
    })();
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-center text-xs text-muted-foreground',
          className
        )}
      >
        Could not load image
      </div>
    );
  }

  if (!src) {
    return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
  }

  return <img src={src} alt={alt ?? 'Church gallery'} className={cn('h-full w-full object-cover', className)} />;
}
