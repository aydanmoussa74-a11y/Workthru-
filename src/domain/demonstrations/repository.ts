/**
 * Demonstration Repository
 * Provides access to structured demonstration assets across different source types.
 */

import { DemonstrationAsset } from './types';

export interface DemonstrationRepository {
  /**
   * Returns all demonstration assets associated with an exercise ID.
   * May return multiple assets (e.g. Real Person, 3D Trainer) or an empty array if none exist.
   */
  getByExerciseId(exerciseId: string): Promise<DemonstrationAsset[]>;

  /**
   * Returns a specific demonstration asset by its unique ID.
   */
  getById(assetId: string): Promise<DemonstrationAsset | null>;

  /**
   * Returns all known demonstration assets in the system.
   */
  getAll(): Promise<DemonstrationAsset[]>;

  /**
   * Adds or updates a demonstration asset in the repository.
   */
  saveAsset(asset: DemonstrationAsset): Promise<void>;
}

/**
 * Curated initial demonstration asset dataset for Phase 7.
 * Provides authentic demonstration metadata with both Real Person and 3D Trainer representations.
 * All assets are marked availableOffline: true and utilize local vector/structural motion models.
 */
export const INITIAL_DEMONSTRATION_ASSETS: DemonstrationAsset[] = [
  // ==================== STANDARD PUSH-UP ====================
  {
    id: 'demo-push-standard-real',
    exerciseId: 'push-standard-pushup',
    sourceType: 'REAL_PERSON',
    title: 'Standard Push-Up • Real Person Demo',
    description: 'Full-range athletic demonstration with neutral spine, controlled 2-second descent, and locked core.',
    mediaUrl: null, // Local vector playback engine used in Phase 7
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio (Real Coach Capture)',
    metadata: {
      angles: ['SIDE', 'FRONT'],
      tempo: '2-0-1',
      repCountInDemo: 1,
      focalCues: ['Elbows at 45° angle', 'Maintain rigid plank line', 'Chest 2 inches from ground'],
      resolution: 'Vector/Motion SVG',
    },
  },
  {
    id: 'demo-push-standard-3d',
    exerciseId: 'push-standard-pushup',
    sourceType: 'THREE_D_TRAINER',
    title: 'Standard Push-Up • 3D Biomechanical Trainer',
    description: 'Biomechanical kinematic model showing musculoskeletal activation in chest, triceps, and anterior deltoids.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Biomechanical Calisthenics Engine v1',
    metadata: {
      angles: ['FRONT', 'SIDE', 'TOP'],
      tempo: '2-1-1',
      repCountInDemo: 1,
      focalCues: ['Pectoralis major activation', 'Scapular protraction at top', 'Anti-extension core brace'],
      resolution: 'Real-time 3D Wireframe/Rig',
    },
  },

  // ==================== WALL PUSH-UP ====================
  {
    id: 'demo-push-wall-real',
    exerciseId: 'push-wall-pushup',
    sourceType: 'REAL_PERSON',
    title: 'Wall Push-Up • Real Person Demo',
    description: 'Upright wall push demonstration emphasizing wrist alignment and diagonal body rigidity.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio',
    metadata: {
      angles: ['SIDE'],
      tempo: '2-0-2',
      repCountInDemo: 1,
      focalCues: ['Hands at shoulder height', 'Straight line from heels to crown', 'Smooth press off wall'],
    },
  },
  {
    id: 'demo-push-wall-3d',
    exerciseId: 'push-wall-pushup',
    sourceType: 'THREE_D_TRAINER',
    title: 'Wall Push-Up • 3D Biomechanical Trainer',
    description: 'Low-impact angle mechanics visualizer highlighting joint angle preservation.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Biomechanical Calisthenics Engine v1',
    metadata: {
      angles: ['SIDE', 'TOP'],
      focalCues: ['Shoulder blade retraction', 'Zero lumbar arch'],
    },
  },

  // ==================== INCLINE PUSH-UP ====================
  {
    id: 'demo-push-incline-real',
    exerciseId: 'push-incline-pushup',
    sourceType: 'REAL_PERSON',
    title: 'Incline Push-Up • Real Person Demo',
    description: 'Elevated bench demonstration showing secure hand placement and full chest touch.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio',
    metadata: {
      angles: ['SIDE'],
      tempo: '2-1-1',
      focalCues: ['Stable surface support', 'Elbows tuck diagonally', 'Exhale on press'],
    },
  },
  {
    id: 'demo-push-incline-3d',
    exerciseId: 'push-incline-pushup',
    sourceType: 'THREE_D_TRAINER',
    title: 'Incline Push-Up • 3D Biomechanical Trainer',
    description: 'Kinematic angle model showing reduced gravitational load vector (~45% bodyweight).',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Biomechanical Calisthenics Engine v1',
    metadata: {
      angles: ['SIDE', 'FRONT'],
      focalCues: ['Neutral wrist angle', 'Mid-chest contact point'],
    },
  },

  // ==================== KNEE PUSH-UP ====================
  {
    id: 'demo-push-knee-real',
    exerciseId: 'push-knee-pushup',
    sourceType: 'REAL_PERSON',
    title: 'Knee Push-Up • Real Person Demo',
    description: 'Floor knee-supported push-up demonstration maintaining straight knee-to-shoulder line.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio',
    metadata: {
      angles: ['SIDE', 'FRONT'],
      tempo: '2-0-1',
      focalCues: ['Do not hinge at hips', 'Chest hovers above floor', 'Squeeze glutes'],
    },
  },

  // ==================== BODYWEIGHT SQUAT ====================
  {
    id: 'demo-legs-squat-real',
    exerciseId: 'legs-bodyweight-squat',
    sourceType: 'REAL_PERSON',
    title: 'Bodyweight Squat • Real Person Demo',
    description: 'Athletic parallel squat demonstration with chest up, knees tracking toes, and flat foot balance.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio',
    metadata: {
      angles: ['SIDE', 'FRONT'],
      tempo: '2-1-1',
      repCountInDemo: 1,
      focalCues: ['Hips back and down', 'Knees track over second toe', 'Weight balanced midfoot'],
    },
  },
  {
    id: 'demo-legs-squat-3d',
    exerciseId: 'legs-bodyweight-squat',
    sourceType: 'THREE_D_TRAINER',
    title: 'Bodyweight Squat • 3D Biomechanical Trainer',
    description: 'Full kinetic chain visualizer showing quadriceps, gluteus maximus, and adductor activation.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Biomechanical Calisthenics Engine v1',
    metadata: {
      angles: ['SIDE', 'FRONT', 'ANGLED'],
      tempo: '2-1-1',
      focalCues: ['Parallel hip crease depth', 'Torso angle parallel to shins', 'Active arch tension'],
    },
  },

  // ==================== GLUTE BRIDGE ====================
  {
    id: 'demo-legs-glute-bridge-real',
    exerciseId: 'legs-glute-bridge',
    sourceType: 'REAL_PERSON',
    title: 'Glute Bridge • Real Person Demo',
    description: 'Supine hip extension demonstration with heel drive and locked pelvic alignment at peak.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 3,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio',
    metadata: {
      angles: ['SIDE'],
      tempo: '2-1-1',
      focalCues: ['Drive through heels', 'Posterior pelvic tilt at top', 'Do not overarch lumbar spine'],
    },
  },
  {
    id: 'demo-legs-glute-bridge-3d',
    exerciseId: 'legs-glute-bridge',
    sourceType: 'THREE_D_TRAINER',
    title: 'Glute Bridge • 3D Biomechanical Trainer',
    description: 'Posterior chain model showing glute and hamstring isometric recruitment vectors.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 3,
    loop: true,
    availableOffline: true,
    attribution: 'Biomechanical Calisthenics Engine v1',
    metadata: {
      angles: ['SIDE', 'TOP'],
      focalCues: ['Peak hip extension lock', 'Ribcage anchored down'],
    },
  },

  // ==================== CORE PLANK ====================
  {
    id: 'demo-core-plank-real',
    exerciseId: 'core-plank',
    sourceType: 'REAL_PERSON',
    title: 'Forearm Plank • Real Person Demo',
    description: 'Isometric anti-extension core hold with elbows beneath shoulders and neutral cervical spine.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 6,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio',
    metadata: {
      angles: ['SIDE'],
      tempo: 'Isometric Hold',
      focalCues: ['Elbows under shoulders', 'Brace core as if taking a punch', 'Squeeze glutes & quads'],
    },
  },
  {
    id: 'demo-core-plank-3d',
    exerciseId: 'core-plank',
    sourceType: 'THREE_D_TRAINER',
    title: 'Forearm Plank • 3D Biomechanical Trainer',
    description: 'Anterior core tension mapping showing rectus abdominis, transversus abdominis, and obliques.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 6,
    loop: true,
    availableOffline: true,
    attribution: 'Biomechanical Calisthenics Engine v1',
    metadata: {
      angles: ['SIDE', 'TOP'],
      focalCues: ['Zero pelvic anterior tilt', 'Active floor push through forearms'],
    },
  },

  // ==================== DOORWAY ROW ====================
  {
    id: 'demo-pull-doorway-row-real',
    exerciseId: 'pull-doorway-row',
    sourceType: 'REAL_PERSON',
    title: 'Doorway Row • Real Person Demo',
    description: 'Horizontal bodyweight pull using a secure doorframe with full scapular retraction.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 4,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio',
    metadata: {
      angles: ['SIDE', 'FRONT'],
      tempo: '2-1-1',
      focalCues: ['Grip secure doorframe at rib height', 'Pull chest smoothly to frame', 'Squeeze shoulder blades'],
    },
  },

  // ==================== JUMPING JACKS (WARMUP) ====================
  {
    id: 'demo-warmup-jumping-jacks-real',
    exerciseId: 'warmup-jumping-jacks',
    sourceType: 'REAL_PERSON',
    title: 'Jumping Jacks • Real Person Demo',
    description: 'Rhythmic aerobic calisthenic movement elevating heart rate and warming shoulder & hip joints.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 3,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio',
    metadata: {
      angles: ['FRONT'],
      tempo: 'Continuous Aerobic Rhythm',
      focalCues: ['Soft landing on balls of feet', 'Full arm arc overhead', 'Rhythmic breathing'],
    },
  },

  // ==================== CAT-COW MOBILITY ====================
  {
    id: 'demo-mobility-cat-cow-real',
    exerciseId: 'mobility-cat-cow',
    sourceType: 'REAL_PERSON',
    title: 'Cat-Cow Mobility • Real Person Demo',
    description: 'Quadruped spinal wave articulating between full flexion and extension with breath coordination.',
    mediaUrl: null,
    posterUrl: null,
    durationSec: 6,
    loop: true,
    availableOffline: true,
    attribution: 'Workout PWA Training Studio',
    metadata: {
      angles: ['SIDE'],
      tempo: 'Slow Wave (3s Inhale, 3s Exhale)',
      focalCues: ['Inhale arching belly down (Cow)', 'Exhale rounding spine toward ceiling (Cat)', 'Gentle neck follow-through'],
    },
  },
];

/**
 * LocalStaticDemonstrationRepository
 * High-performance, in-memory repository implementing local-first demonstration retrieval.
 */
export class LocalStaticDemonstrationRepository implements DemonstrationRepository {
  private assets: DemonstrationAsset[];

  constructor(initialAssets: DemonstrationAsset[] = INITIAL_DEMONSTRATION_ASSETS) {
    this.assets = [...initialAssets];
  }

  public async getByExerciseId(exerciseId: string): Promise<DemonstrationAsset[]> {
    if (!exerciseId) return [];
    return this.assets.filter((a) => a.exerciseId === exerciseId);
  }

  public async getById(assetId: string): Promise<DemonstrationAsset | null> {
    if (!assetId) return null;
    const found = this.assets.find((a) => a.id === assetId);
    return found || null;
  }

  public async getAll(): Promise<DemonstrationAsset[]> {
    return [...this.assets];
  }

  public async saveAsset(asset: DemonstrationAsset): Promise<void> {
    const index = this.assets.findIndex((a) => a.id === asset.id);
    if (index >= 0) {
      this.assets[index] = asset;
    } else {
      this.assets.push(asset);
    }
  }
}

/**
 * Default Singleton Demonstration Repository
 */
export const defaultDemonstrationRepository = new LocalStaticDemonstrationRepository();
