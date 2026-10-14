export const brochurePrices: Record<string, number> = { 'discover-scuba': 299900, 'boat-dive': 299900 };
export const catalog = [
  { slug: 'discover-scuba', name: 'Discover Scuba Diving', kind: 'activity' },
  { slug: 'boat-dive', name: 'Boat Dive', kind: 'activity' },
  { slug: 'shore-dive', name: 'Shore Dive', kind: 'activity' },
  { slug: 'snorkeling', name: 'Snorkeling', kind: 'activity' },
  { slug: 'sea-walk', name: 'Sea Walk', kind: 'activity' },
  { slug: 'kayaking', name: 'Kayaking', kind: 'activity' },
  { slug: 'island-tour', name: 'Island Tours', kind: 'activity' },
  { slug: 'open-water', name: 'Open Water', kind: 'course' },
  { slug: 'advanced', name: 'Advanced', kind: 'course' },
  { slug: 'rescue-diver', name: 'Rescue Diver', kind: 'course' },
  { slug: 'divemaster', name: 'Divemaster', kind: 'course' },
] as const;
