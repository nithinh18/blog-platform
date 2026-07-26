export const CATEGORIES = ['Technology', 'Lifestyle', 'Travel', 'Food', 'General'];

// Monochrome badge for every category — the accent color is reserved for
// links, primary actions, and focus states, not for tagging content.
const BADGE_CLASS =
  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

export const categoryBadgeClass = () => BADGE_CLASS;
