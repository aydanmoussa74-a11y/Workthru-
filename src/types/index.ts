/**
 * Core Global Types for Workout PWA
 */

export type AppDestination = 'home' | 'train' | 'progress' | 'library';

export interface RouteMeta {
  id: AppDestination;
  label: string;
  shortLabel: string;
  iconName: 'Home' | 'Flame' | 'TrendingUp' | 'BookOpen';
  description: string;
}
