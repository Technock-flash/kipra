export interface GalleryItem {
  id: string;
  caption: string | null;
  sortOrder: number;
  originalName: string;
  createdAt: string;
  uploadedBy: { id: string; firstName: string; lastName: string };
}
