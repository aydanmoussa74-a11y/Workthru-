/**
 * Utility functions for Workout PWA
 */

export function classNames(...classes: Array<string | boolean | undefined | null>): string {
  return classes.filter(Boolean).join(' ');
}
