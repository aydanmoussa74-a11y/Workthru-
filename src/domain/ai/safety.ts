/**
 * AI Coach Safety Guardrails (Phase 9)
 * Enforces strict safety rules:
 * - Immediate rest/stop on pain or acute symptoms
 * - No medical diagnoses or medication recommendations
 * - No extreme challenges or hazardous training encouragement
 * - No body-shaming, appearance ideals, or comparative metrics
 */

import { CoachSafetyStatus } from './types';

// 1. Medical diagnosis or prescription requests
const MEDICAL_DIAGNOSIS_PATTERNS = [
  /\b(diagnos(e|is)|what'?s\s+wrong\s+with\s+my|medical\s+advice)\b/i,
  /\b(is\s+my\s+\w+\s+(broken|torn|fractured|damaged))\b/i,
  /\b(should\s+i\s+take\s+(ibuprofen|advil|tylenol|aspirin|painkillers|steroids|medication|pills))\b/i,
  /\b(rotator\s+cuff|herniated\s+disc|tendonitis|bursitis|impingement|meniscus)\b/i,
];

// 2. Extreme training, punishment, starvation, dehydration
const EXTREME_TRAINING_PATTERNS = [
  /\b(train|push)\s+(until|till)\s+(\w+\s+)?(puke|vomit|collapse|faint|pass\s*out|failure|exhaustion)\b/i,
  /\b(no\s+pain\s+no\s+gain|push\s+through\s+(the\s+)?pain|ignore\s+(the\s+)?pain)\b/i,
  /\b(starve|skip\s+all\s+meals|dry\s+fast|no\s+water|dehydrate|dehydration)\b/i,
  /\b(1000\s+pushups\s+today|insane\s+challenge|punish\s+myself|punishment)\b/i,
];

// 3. Body shaming, aesthetic comparison, or unhealthy appearance ideals
const BODY_IMAGE_PATTERNS = [
  /\b(am\s+i\s+(too\s+)?(fat|ugly|skinny|heavy|chubby|gross))\b/i,
  /\b(hate\s+my\s+body|body\s+ranking|rate\s+my\s+body|burn\s+belly\s+fat\s+fast)\b/i,
  /\b(look\s+like\s+a\s+model|thigh\s+gap|skinny\s+waist\s+in\s+3\s+days|beach\s+body\s+diet)\b/i,
];

// 4. Acute pain, physical distress, dizziness, or injury symptoms
const PAIN_AND_DISTRESS_PATTERNS = [
  /\b(sharp|acute|severe|intense|stabbing|burning)\s+(pain|ache|soreness)\b/i,
  /\b(hurts?|hurting|painful|injured|sprain|strained?|pulled)\b/i,
  /\b(dizzy|dizziness|lightheaded|faint|fainting|blackout|nauseous)\b/i,
  /\b(chest\s+pain|chest\s+tightness|can'?t\s+breathe|shortness\s+of\s+breath|heart\s+racing|palpitations)\b/i,
  /\b(knee|shoulder|back|wrist|elbow|neck|ankle)\s+(clicked|popped|snapped|locked|swollen|swelling)\b/i,
];

/**
 * Evaluates any input text or user prompt against safety invariants.
 */
export function evaluateCoachingSafety(input: string): CoachSafetyStatus {
  if (!input || typeof input !== 'string') {
    return {
      isSafe: true,
      flaggedCategory: 'NONE',
    };
  }

  const cleanText = input.trim();

  // 1. Medical Diagnosis or Medication
  for (const pattern of MEDICAL_DIAGNOSIS_PATTERNS) {
    if (pattern.test(cleanText)) {
      return {
        isSafe: false,
        flaggedCategory: 'MEDICAL_DIAGNOSIS',
        safetyAdvice:
          'I am an exercise coach, not a medical professional. I cannot diagnose injuries or recommend medication. Please consult a qualified doctor, physical therapist, or healthcare provider for medical evaluation.',
      };
    }
  }

  // 2. Extreme Training / Harmful Practices
  for (const pattern of EXTREME_TRAINING_PATTERNS) {
    if (pattern.test(cleanText)) {
      return {
        isSafe: false,
        flaggedCategory: 'EXTREME_CHALLENGE',
        safetyAdvice:
          'Sustainable fitness is built on consistent, progressive movement and adequate recovery—never extreme punishment or dangerous exhaustion. Train within safe control and stay hydrated.',
      };
    }
  }

  // 3. Body Image / Aesthetic Shaming
  for (const pattern of BODY_IMAGE_PATTERNS) {
    if (pattern.test(cleanText)) {
      return {
        isSafe: false,
        flaggedCategory: 'BODY_IMAGE',
        safetyAdvice:
          'Our training focuses purely on movement capability, strength, joint mobility, and long-term consistency—never on appearance or comparison. Celebrate what your body can accomplish today.',
      };
    }
  }

  // 4. Pain or Physical Distress
  for (const pattern of PAIN_AND_DISTRESS_PATTERNS) {
    if (pattern.test(cleanText)) {
      return {
        isSafe: false,
        flaggedCategory: 'PAIN_OR_INJURY',
        safetyAdvice:
          'Please stop the current exercise and rest immediately. Training through pain can cause or worsen injury. If pain, dizziness, or joint discomfort persists, consult a qualified health professional or parent/guardian.',
      };
    }
  }

  return {
    isSafe: true,
    flaggedCategory: 'NONE',
  };
}
