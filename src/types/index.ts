/**
 * Core Global Types for Workout PWA
 */

export type AppDestination = 'home' | 'train' | 'progress' | 'library' | 'media';

export interface RouteMeta {
  id: AppDestination;
  label: string;
  shortLabel: string;
  iconName: 'Home' | 'Flame' | 'TrendingUp' | 'BookOpen' | 'Video';
  description: string;
}
