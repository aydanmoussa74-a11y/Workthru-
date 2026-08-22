/**
 * Coach Panel Component (Phase 9)
 * Compact, non-intrusive advisory coaching interface integrated into the Training Player.
 * TrainingEngine and exercise demonstrations remain visually primary.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  MessageSquare,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from '../../ui/icons';
import { CoachContext, CoachMessage, CoachMode, CoachService } from '../../domain/ai/types';
import { VoiceService } from '../../domain/ai/voice';
import { CoachModeSelector } from './CoachModeSelector';
import { AskCoachModal } from './AskCoachModal';

interface CoachPanelProps {
  coachService: CoachService;
  voiceService?: VoiceService;
  context: CoachContext;
  currentMessage: CoachMessage | null;
  onDismissMessage: () => void;
  onAskQuestion: (question: string) => Promise<void>;
  onModeChange: (mode: CoachMode) => void;
  onToggleEnabled: (enabled: boolean) => void;
  isLoading?: boolean;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({
  coachService,
  voiceService,
  context,
  currentMessage,
  onDismissMessage,
  onAskQuestion,
  onModeChange,
  onToggleEnabled,
  isLoading = false,
}) => {
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(voiceService?.isEnabled() || false);

  const isEnabled = coachService.isEnabled();
  const currentMode = coachService.getMode();

  const handleToggleVoice = () => {
    if (!voiceService) return;
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    voiceService.setEnabled(next);
    if (next && currentMessage) {
      voiceService.speak(currentMessage.content);
    }
  };

  const handleSelectQuickSuggestion = async (suggestion: string) => {
    await onAskQuestion(suggestion);
  };

  return (
    <section
      id="training-coach-panel"
      aria-label="AI Coach Guidance"
      className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 space-y-2.5 transition-all text-xs"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-950/90 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-neutral-200">Coach</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
            {currentMode}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Voice Toggle */}
          {voiceService?.isSupported() && (
            <button
              type="button"
              onClick={handleToggleVoice}
              title={voiceEnabled ? 'Mute voice cues' : 'Enable voice cues'}
              aria-label={voiceEnabled ? 'Mute voice cues' : 'Enable voice cues'}
              className={`p-1.5 rounded-lg border transition-colors ${
                voiceEnabled
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Ask Coach */}
          <button
            type="button"
            onClick={() => setIsAskModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px] font-medium transition-colors"
          >
            <MessageSquare className="w-3 h-3 text-emerald-400" />
            <span>Ask</span>
          </button>

          {/* Settings / Mode Toggle */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Toggle coach settings"
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Coach Controls / Mode Selector */}
      {showSettings && (
        <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Coaching Level</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span>{isEnabled ? 'Active' : 'Disabled'}</span>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => onToggleEnabled(e.target.checked)}
                className="rounded border-neutral-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5 bg-neutral-900"
              />
            </label>
          </div>
          <CoachModeSelector
            currentMode={currentMode}
            onModeChange={onModeChange}
            disabled={!isEnabled}
          />
        </div>
      )}

      {/* Active Coach Message / Safety Alert */}
      {currentMessage && isEnabled && (
        <div
          className={`p-2.5 rounded-lg border relative transition-all ${
            currentMessage.safetyStatus && !currentMessage.safetyStatus.isSafe
              ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
              : 'bg-neutral-950/80 border-neutral-800/90 text-neutral-200'
          }`}
        >
          {/* Dismiss button */}
          <button
            type="button"
            onClick={onDismissMessage}
            aria-label="Dismiss coach message"
            className="absolute top-2 right-2 text-neutral-500 hover:text-neutral-300 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="space-y-1.5 pr-5">
            {/* Safety Indicator or Source Badge */}
            {currentMessage.safetyStatus && !currentMessage.safetyStatus.isSafe ? (
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" />
                <span>Safety Notice: {currentMessage.safetyStatus.flaggedCategory}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-emerald-400/90 uppercase tracking-wider">
                  {currentMessage.source === 'REMOTE_AI' ? 'AI Coach' : 'Local Coach'}
                </span>
                {currentMessage.eventTrigger && (
                  <span className="text-[10px] text-neutral-500 font-mono">
                    • {currentMessage.eventTrigger.replace('_', ' ').toLowerCase()}
                  </span>
                )}
              </div>
            )}

            {/* Message Body */}
            <p className="text-xs leading-relaxed font-normal text-neutral-200">
              {currentMessage.content}
            </p>

            {/* Quick response suggestions if present */}
            {currentMessage.suggestions && currentMessage.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {currentMessage.suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleSelectQuickSuggestion(sug)}
                    className="px-2 py-0.5 text-[10px] rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="text-[11px] text-neutral-500 italic flex items-center gap-1.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Consulting coach...</span>
        </div>
      )}

      {/* Ask Coach Modal */}
      <AskCoachModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        onSubmitQuestion={onAskQuestion}
        context={context}
        isLoading={isLoading}
      />
    </section>
  );
};
