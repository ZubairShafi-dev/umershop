export function formatTimestamp(ts) {
  if (!ts) return '—';
  // Firestore Timestamp object
  if (ts.seconds !== undefined) {
    return new Date(ts.seconds * 1000).toLocaleString();
  }
  // JavaScript Date
  if (ts instanceof Date) {
    return ts.toLocaleString();
  }
  // If already a string
  return String(ts);
}
