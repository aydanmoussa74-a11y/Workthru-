import { RouteMeta } from '../../types';

export const APP_ROUTES: RouteMeta[] = [
  {
    id: 'home',
    label: 'Home',
    shortLabel: 'Home',
    iconName: 'Home',
    description: "Today's training and readiness",
  },
  {
    id: 'train',
    label: 'Train',
    shortLabel: 'Train',
    iconName: 'Flame',
    description: 'Active workout execution',
  },
  {
    id: 'progress',
    label: 'Progress',
    shortLabel: 'Progress',
    iconName: 'TrendingUp',
    description: 'Consistency and movement proficiency',
  },
  {
    id: 'library',
    label: 'Library',
    shortLabel: 'Library',
    iconName: 'BookOpen',
    description: 'Movement techniques and variations',
  },
];
