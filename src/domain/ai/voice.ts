/**
 * AI Coach Speech / Voice Service Boundary (Phase 9)
 * Optional, lightweight Web Speech API wrapper for hands-free audio cues.
 * Training and UI remain 100% operational when voice is disabled or unsupported.
 */

export interface VoiceService {
  speak(text: string): void;
  stop(): void;
  isSupported(): boolean;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
}

export class BrowserVoiceService implements VoiceService {
  private enabled: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(initialEnabled: boolean = false) {
    this.enabled = initialEnabled;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public speak(text: string): void {
    if (!this.enabled || !this.isSupported()) return;

    try {
      this.stop();

      // Clean text for speech (remove markdown symbols)
      const cleanText = text.replace(/[*_#`~]/g, '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05; // Slightly athletic, brisk pace
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Gracefully ignore voice synthesis errors on restricted devices
    }
  }

  public stop(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    } catch {
      // Ignore
    }
  }
}

/** Default singleton instance */
export const defaultVoiceService = new BrowserVoiceService(false);
