/**
 * YouTube Media Domain & Demonstration Integration Tests (Phase 8)
 */

import {
  buildFocusedWorkoutQuery,
  BoundedTtlCache,
  normalizeYouTubeItem,
} from '../search';
import {
  DefaultYouTubeService,
  CURATED_YOUTUBE_MEDIA,
  defaultYouTubeService,
} from '../service';
import {
  defaultDemonstrationRepository,
} from '../../../demonstrations/repository';
import {
  resolveDemonstrations,
  formatDemonstrationSourceLabel,
} from '../../../demonstrations/resolver';

export async function runYouTubeDomainTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`Assertion failed: ${testName}`);
    }
  };

  try {
    // 1. Query Builder Tests
    const q1 = buildFocusedWorkoutQuery('push up', 'EXERCISE');
    assert(q1.includes('calisthenics exercise form tutorial'), 'Query builder includes exercise safety terms');

    const q2 = buildFocusedWorkoutQuery('core workout', 'WORKOUT');
    assert(q2.includes('follow along workout routine'), 'Query builder includes follow along workout terms');

    const q3 = buildFocusedWorkoutQuery('hip stretch', 'MOBILITY');
    assert(q3.includes('mobility routine flexibility recovery'), 'Query builder includes mobility terms');

    const q4 = buildFocusedWorkoutQuery('<script>alert("hack")</script> standard pushup');
    assert(!q4.includes('<script>'), 'Query builder strips dangerous characters');

    // 2. Bounded TTL Cache Tests
    const cache = new BoundedTtlCache<string>(3, 50, true); // 3 items max, 50ms TTL
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    assert(cache.get('key1') === 'val1', 'Cache retrieves valid item');

    cache.set('key3', 'val3');
    cache.set('key4', 'val4'); // Should evict key1
    assert(cache.get('key1') === null, 'Cache evicts oldest when capacity exceeded');
    assert(cache.get('key4') === 'val4', 'Cache retains recent items');

    // Wait for TTL expiration
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert(cache.get('key4') === null, 'Cache item expires after TTL');

    // 3. YouTube Normalizer Tests
    const mockRawItem = {
      id: { videoId: 'abc12345678' },
      snippet: {
        title: 'Calisthenics Form &amp; Mastery',
        description: 'Clean description &quot;quotes&quot;',
        thumbnails: {
          high: { url: 'https://i.ytimg.com/vi/abc/hq.jpg' },
        },
        channelId: 'chan123',
        channelTitle: 'Channel Pro',
        publishedAt: '2023-01-01T00:00:00Z',
      },
    };
    const normalized = normalizeYouTubeItem(mockRawItem, 'EXERCISE', 'push-1');
    assert(normalized !== null, 'Item is normalized correctly');
    assert(normalized?.videoId === 'abc12345678', 'Video ID preserved');
    assert(normalized?.title === 'Calisthenics Form & Mastery', 'HTML entities decoded in title');
    assert(normalized?.sourceType === 'YOUTUBE_VIDEO', 'Source type set to YOUTUBE_VIDEO');

    // 4. YouTube Service Fallback Tests
    const service = new DefaultYouTubeService(undefined);
    const searchResp = await service.search({
      query: 'push up',
      category: 'EXERCISE',
    });
    assert(searchResp.items.length > 0, 'Service returns curated items on offline/missing key');
    assert(searchResp.items.every((v) => v.sourceType === 'YOUTUBE_VIDEO'), 'All items are YouTube video type');

    const curatedExercises = service.getCuratedByCategory('EXERCISE');
    assert(curatedExercises.length >= 5, 'Curated exercise list has rich collection');

    const curatedWorkouts = service.getCuratedByCategory('WORKOUT');
    assert(curatedWorkouts.length >= 3, 'Curated workout list has follow along sessions');

    // 5. Demonstration System Integration Tests
    const pushDemos = await defaultDemonstrationRepository.getByExerciseId('push-standard-pushup');
    assert(pushDemos.length >= 3, 'Push-up has multiple demonstration sources');

    const hasYoutube = pushDemos.some((d) => d.sourceType === 'YOUTUBE_VIDEO');
    assert(hasYoutube, 'Push-up includes YouTube demonstration source');

    const hasRealPerson = pushDemos.some((d) => d.sourceType === 'REAL_PERSON');
    const has3D = pushDemos.some((d) => d.sourceType === 'THREE_D_TRAINER');
    assert(hasRealPerson && has3D, 'Push-up preserves Real Person and 3D demonstrations');

    // Demonstration Resolver
    const resolved = await resolveDemonstrations('push-standard-pushup', defaultDemonstrationRepository);
    assert(resolved.state === 'AVAILABLE', 'Demonstrations resolved as AVAILABLE');
    assert(resolved.assets.length >= 3, 'Carousel contains multiple assets');
    assert(formatDemonstrationSourceLabel('YOUTUBE_VIDEO') === 'YouTube', 'Source label formatted correctly');

  } catch (err: any) {
    failed++;
    errors.push(`Unhandled error in test: ${err?.message || err}`);
  }

  return { passed, failed, errors };
}
