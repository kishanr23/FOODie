// ─── App Constants ───

export const APP_NAME = 'FOODie';
export const APP_DESCRIPTION = 'Discover places through people and real experiences.';
export const APP_TAGLINE = 'Real people. Real places. Real vibes.';

// ─── Visit Verification ───
export const VISIT_RADIUS_METERS = 200; // Must be within 200m of venue
export const VISIT_COOLDOWN_HOURS = 4;  // Same venue cooldown
export const MAX_VISITS_PER_HOUR = 5;

// ─── Pagination ───
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// ─── Media ───
export const MAX_PHOTOS_PER_POST = 5;
export const MAX_FILE_SIZE_MB = 10;
export const IMAGE_QUALITY = 80;
export const THUMBNAIL_WIDTH = 400;
export const FULL_IMAGE_WIDTH = 1200;

// ─── Vibes (Initial Taxonomy) ───
export const DEFAULT_VIBES = [
  { name: 'Quiet & WFH', slug: 'quiet-wfh', emoji: '🤫' },
  { name: 'First Date', slug: 'first-date', emoji: '💕' },
  { name: 'Late Night', slug: 'late-night', emoji: '🌙' },
  { name: 'Budget Eats', slug: 'budget-eats', emoji: '💰' },
  { name: 'Rooftop', slug: 'rooftop', emoji: '🏙️' },
  { name: 'Family Friendly', slug: 'family-friendly', emoji: '👨‍👩‍👧‍👦' },
  { name: 'Group Hangout', slug: 'group-hangout', emoji: '🎉' },
  { name: 'Live Music', slug: 'live-music', emoji: '🎵' },
  { name: 'Romantic', slug: 'romantic', emoji: '❤️' },
  { name: 'Study Friendly', slug: 'study-friendly', emoji: '📚' },
  { name: 'Instagrammable', slug: 'instagrammable', emoji: '📸' },
  { name: 'Quick Bite', slug: 'quick-bite', emoji: '⚡' },
  { name: 'Hidden Gem', slug: 'hidden-gem', emoji: '💎' },
  { name: 'Outdoor Seating', slug: 'outdoor-seating', emoji: '🌿' },
] as const;

// ─── Place Categories ───
export const DEFAULT_CATEGORIES = [
  { name: 'Restaurant', slug: 'restaurant', icon: 'UtensilsCrossed' },
  { name: 'Café', slug: 'cafe', icon: 'Coffee' },
  { name: 'Bakery', slug: 'bakery', icon: 'Croissant' },
  { name: 'Street Food', slug: 'street-food', icon: 'Flame' },
  { name: 'Food Truck', slug: 'food-truck', icon: 'Truck' },
  { name: 'Dessert Shop', slug: 'dessert-shop', icon: 'IceCreamCone' },
  { name: 'Pub / Bar', slug: 'pub-bar', icon: 'Beer' },
  { name: 'Rooftop', slug: 'rooftop-venue', icon: 'Building' },
  { name: 'Food Event', slug: 'food-event', icon: 'CalendarHeart' },
  { name: 'Juice / Smoothie Bar', slug: 'juice-bar', icon: 'GlassWater' },
] as const;

// ─── Default Cuisines ───
export const DEFAULT_CUISINES = [
  'South Indian',
  'North Indian',
  'Chinese',
  'Italian',
  'Continental',
  'Mughlai',
  'Andhra',
  'Kerala',
  'Street Food',
  'Desserts',
  'Beverages',
  'Fast Food',
  'Multi-cuisine',
  'Bengali',
  'Japanese',
  'Mexican',
  'Thai',
  'Mediterranean',
] as const;

// ─── Map ───
export const MAP_DEFAULT_CENTER = {
  lat: 12.3051,  // Mysuru center
  lng: 76.6551,
};
export const MAP_DEFAULT_ZOOM = 13;
export const MAP_STYLE_URL = `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
