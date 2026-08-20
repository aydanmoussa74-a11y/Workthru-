/**
 * Phase 0 Foundation Verification
 */

import { APP_ROUTES } from '../src/app/routes';
import { tokens } from '../src/ui/design-system/tokens';

export function runFoundationChecks(): boolean {
  // 1. Verify 4 destinations exist
  const routeIds = APP_ROUTES.map((r) => r.id);
  const expectedRoutes = ['home', 'train', 'progress', 'library'];
  const routesValid =
    routeIds.length === 4 && expectedRoutes.every((id) => routeIds.includes(id as any));

  // 2. Verify design tokens exist
  const tokensValid = tokens.colors.bg === '#0a0a0a' && tokens.colors.textPrimary === '#fafafa';

  return routesValid && tokensValid;
}
