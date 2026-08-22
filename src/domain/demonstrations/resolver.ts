/**
 * Demonstration Resolver
 * Pure domain logic that resolves available demonstration assets, evaluates availability,
 * respects offline capabilities, and manages deterministic carousel navigation.
 */

import {
  DemonstrationAsset,
  DemonstrationAvailabilityState,
  DemonstrationResolution,
  DemonstrationResolutionOptions,
  DemonstrationSourceType,
} from './types';
import { DemonstrationRepository } from './repository';

/**
 * Resolves available demonstrations for an exercise from a repository.
 * Evaluates online availability, filters unusable assets, and selects the primary asset.
 */
export async function resolveDemonstrations(
  exerciseId: string,
  repository: DemonstrationRepository,
  options: DemonstrationResolutionOptions = {}
): Promise<DemonstrationResolution> {
  if (!exerciseId || exerciseId.trim() === '') {
    return {
      exerciseId: '',
      state: 'UNAVAILABLE',
      assets: [],
      selectedAsset: null,
      selectedIndex: -1,
      availableSourceTypes: [],
      statusMessage: 'No exercise specified for demonstration lookup.',
    };
  }

  try {
    const rawAssets = await repository.getByExerciseId(exerciseId);

    if (!rawAssets || rawAssets.length === 0) {
      return {
        exerciseId,
        state: 'UNAVAILABLE',
        assets: [],
        selectedAsset: null,
        selectedIndex: -1,
        availableSourceTypes: [],
        statusMessage: 'No demonstration is currently registered for this exercise. Follow the written technique guidance below.',
      };
    }

    // Evaluate connectivity constraint
    const isOnline = options.isOnline !== undefined ? options.isOnline : true;
    const availableAssets = rawAssets.filter((asset) => {
      // If asset requires network and user is offline, asset is unavailable
      if (!asset.availableOffline && !isOnline) {
        return false;
      }
      return true;
    });

    if (availableAssets.length === 0) {
      return {
        exerciseId,
        state: 'UNAVAILABLE',
        assets: [],
        selectedAsset: null,
        selectedIndex: -1,
        availableSourceTypes: [],
        statusMessage: 'Demonstration media requires an active internet connection. Written technique guidance remains active.',
      };
    }

    // Determine distinct available source types
    const availableSourceTypes: DemonstrationSourceType[] = Array.from(
      new Set(availableAssets.map((a) => a.sourceType))
    );

    // Determine initial selection
    let selectedIndex = 0;
    if (options.preferredSourceType) {
      const matchIdx = availableAssets.findIndex(
        (a) => a.sourceType === options.preferredSourceType
      );
      if (matchIdx >= 0) {
        selectedIndex = matchIdx;
      }
    }

    return {
      exerciseId,
      state: 'AVAILABLE',
      assets: availableAssets,
      selectedAsset: availableAssets[selectedIndex],
      selectedIndex,
      availableSourceTypes,
    };
  } catch (err: any) {
    return {
      exerciseId,
      state: 'ERROR',
      assets: [],
      selectedAsset: null,
      selectedIndex: -1,
      availableSourceTypes: [],
      statusMessage: 'Failed to retrieve demonstration assets. Written guidance is active.',
      errorMessage: err?.message || String(err),
    };
  }
}

/**
 * Pure transition helper to switch demonstration selection by direction or index.
 * Handles boundary wrapping and returns a new immutable resolution snapshot.
 * Switching demonstrations never alters workout progression or training engine state.
 */
export function switchDemonstration(
  currentResolution: DemonstrationResolution,
  target: 'next' | 'prev' | number
): DemonstrationResolution {
  if (
    currentResolution.state !== 'AVAILABLE' ||
    currentResolution.assets.length <= 1
  ) {
    return currentResolution;
  }

  const count = currentResolution.assets.length;
  let newIndex = currentResolution.selectedIndex;

  if (target === 'next') {
    newIndex = (currentResolution.selectedIndex + 1) % count;
  } else if (target === 'prev') {
    newIndex = (currentResolution.selectedIndex - 1 + count) % count;
  } else if (typeof target === 'number') {
    if (target >= 0 && target < count) {
      newIndex = target;
    }
  }

  if (newIndex === currentResolution.selectedIndex) {
    return currentResolution;
  }

  return {
    ...currentResolution,
    selectedIndex: newIndex,
    selectedAsset: currentResolution.assets[newIndex],
  };
}

/**
 * Maps a DemonstrationSourceType to a human-readable display label.
 */
export function formatDemonstrationSourceLabel(sourceType: DemonstrationSourceType): string {
  switch (sourceType) {
    case 'REAL_PERSON':
      return 'Real Person';
    case 'THREE_D_TRAINER':
      return '3D Trainer';
    case 'YOUTUBE_VIDEO':
      return 'YouTube';
    case 'FUTURE_AI_GENERATED':
      return 'AI Generated';
    case 'FUTURE_EXTERNAL_VIDEO':
      return 'External Video';
    default:
      return 'Demonstration';
  }
}
