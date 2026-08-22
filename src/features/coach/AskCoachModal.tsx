/**
 * Ask Coach Modal / Input Sheet (Phase 9)
 * Focused dialog for asking movement technique or modification questions.
 */

import React, { useState } from 'react';
import { X, Send, Sparkles, HelpCircle } from '../../ui/icons';
import { CoachContext } from '../../domain/ai/types';

interface AskCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuestion: (question: string) => Promise<void>;
  context: CoachContext;
  isLoading?: boolean;
}

const COMMON_PROMPTS = [
  'How do I make this easier?',
  'What is the breathing pattern?',
  'Which muscles should I feel?',
  'Key form cues for this movement',
  'How to progress this exercise',
];

export const AskCoachModal: React.FC<AskCoachModalProps> = ({
  isOpen,
  onClose,
  onSubmitQuestion,
  context,
  isLoading = false,
}) => {
  const [question, setQuestion] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    const q = question.trim();
    setQuestion('');
    await onSubmitQuestion(q);
    onClose();
  };

  const handleSelectPrompt = async (prompt: string) => {
    if (isLoading) return;
    await onSubmitQuestion(prompt);
    onClose();
  };

  const exName = context.currentExercise?.name || 'current movement';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Ask AI Coach</h3>
              <p className="text-[11px] text-neutral-400">Guidance for {exName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
            Quick Questions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSelectPrompt(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Question Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-neutral-900">
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask about ${exName} form, breathing, or adjustments...`}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-600 pr-10"
              autoFocus
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="absolute right-2 top-2 w-7 h-7 bg-emerald-600 disabled:bg-neutral-800 text-white disabled:text-neutral-500 rounded-lg flex items-center justify-center transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Advisory only. If you feel acute pain or discomfort, stop and rest.</span>
          </div>
        </form>
      </div>
    </div>
  );
};
