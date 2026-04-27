/** Socket.IO server origin (no `/api` path). */
export function getSocketBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  return raw.replace(/\/api\/?$/, '') || 'http://localhost:5001';
}
