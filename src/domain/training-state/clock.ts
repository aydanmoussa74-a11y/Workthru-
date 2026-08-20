/**
 * Clock Abstraction
 * Decouples time retrieval from Date.now() for deterministic testing and timing calculations.
 */

export interface Clock {
  /**
   * Returns current time in milliseconds since Unix epoch.
   */
  now(): number;
}

/**
 * System Clock using real system time.
 */
export class SystemClock implements Clock {
  public now(): number {
    return Date.now();
  }
}

/**
 * Fake/Test Clock for deterministic, controllable unit testing without real-time delays.
 */
export class FakeClock implements Clock {
  private currentTime: number;

  constructor(initialTimeMs: number = 1000000000000) {
    this.currentTime = initialTimeMs;
  }

  public now(): number {
    return this.currentTime;
  }

  /**
   * Advances the fake clock by specified milliseconds.
   */
  public advance(ms: number): void {
    if (ms < 0) {
      throw new Error(`Cannot advance clock by negative duration: ${ms}ms`);
    }
    this.currentTime += ms;
  }

  /**
   * Advances the fake clock by specified seconds.
   */
  public advanceSec(seconds: number): void {
    this.advance(seconds * 1000);
  }

  /**
   * Sets the clock to an absolute timestamp in milliseconds.
   */
  public set(timestampMs: number): void {
    this.currentTime = timestampMs;
  }
}

export const defaultClock: Clock = new SystemClock();
