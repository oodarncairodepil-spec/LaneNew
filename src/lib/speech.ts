/**
 * Client-side Text-to-Speech using the Web Speech API.
 * Target: Chrome Mobile (Android), Desktop Chrome, Edge.
 * Language: English (UK). Preferred voice: "Google UK English Female".
 * No backend; speech only on explicit button click. Supports pause/resume.
 *
 * Voice options (device-dependent): call getAvailableVoices() to list names and lang.
 * Common names: "Google UK English Female", "Microsoft Zira", "Samantha", "Karen",
 * "Microsoft Hazel", "Google US English", "Moira", "Daniel".
 *
 * Mobile (phone browser): Speech must start from a direct user click (autoplay policy).
 * Voices may be empty until after the first tap; we wait for onvoiceschanged and a
 * 1.5s fallback. Opening the text preview then tapping Play counts as user gesture.
 */

const PREFERRED_VOICE_NAME = 'Google UK English Female';
const LANG = 'en-GB';

/** Slightly slower rate reduces robotic effect; consistent with other TTS usage in the app. */
const DEFAULT_RATE = 0.93;
const DEFAULT_PITCH = 1.0;
const DEFAULT_VOLUME = 1.0;

const QUALITY_KEYWORDS = ['premium', 'enhanced', 'neural', 'natural', 'wavenet', 'studio'];

/**
 * Select best available voice: exact name -> quality-keyword (en) -> en-GB -> en-US -> any en.
 * Prefer premium/enhanced/neural voices when available for more natural sound.
 */
function getPreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const exact = voices.find((v) => v.name === PREFERRED_VOICE_NAME);
  if (exact) return exact;

  const isQuality = (v: SpeechSynthesisVoice) =>
    QUALITY_KEYWORDS.some((k) => v.name.toLowerCase().includes(k));
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  const qualityEn = enVoices.filter(isQuality);
  if (qualityEn.length > 0) {
    const enGB = qualityEn.find((v) => v.lang.startsWith('en-GB'));
    if (enGB) return enGB;
    const enUS = qualityEn.find((v) => v.lang.startsWith('en-US'));
    if (enUS) return enUS;
    return qualityEn[0];
  }

  const enGB = enVoices.find((v) => v.lang.startsWith('en-GB'));
  if (enGB) return enGB;
  const enUS = enVoices.find((v) => v.lang.startsWith('en-US'));
  if (enUS) return enUS;
  return enVoices[0] ?? voices[0] ?? null;
}

export interface SpeakOptions {
  onEnd?: () => void;
  /** Override voice (e.g. user-selected). If null/undefined, uses preferred voice. */
  voice?: SpeechSynthesisVoice | null;
}

function doSpeak(
  text: string,
  synth: SpeechSynthesis,
  onEnd?: () => void,
  voiceOverride?: SpeechSynthesisVoice | null
): void {
  const voices = synth.getVoices();
  const voice = voiceOverride ?? getPreferredVoice(voices);
  const normalized = text.replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();
  const u = new SpeechSynthesisUtterance(normalized);
  u.lang = LANG;
  if (voice) u.voice = voice;
  u.rate = DEFAULT_RATE;
  u.pitch = DEFAULT_PITCH;
  u.volume = DEFAULT_VOLUME;
  if (onEnd) u.onend = () => onEnd();
  synth.speak(u);
}

/**
 * Returns all available TTS voices (may be empty until onvoiceschanged fires on mobile).
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return [];
  return window.speechSynthesis.getVoices();
}

/** English voices (US/UK preferred; includes other en-* on mobile where only those may exist). */
export function getEnglishVoices(): SpeechSynthesisVoice[] {
  return getAvailableVoices().filter((v) => v.lang.startsWith('en'));
}

/**
 * Pause current speech. No-op if not speaking.
 */
export function pauseSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}

/**
 * Resume paused speech. No-op if not paused.
 */
export function resumeSpeech(): void {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.resume();
  }
}

/**
 * Speak the given text using the Web Speech API.
 * Cancels any ongoing speech first. Uses UK English with preferred/fallback voice.
 * If voices are not loaded yet (common on Chrome Mobile), waits for onvoiceschanged once then speaks.
 */
export function speakText(text: string, options?: SpeakOptions): void {
  const t = text?.trim();
  if (!t) return;

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  if (!synth) return;

  synth.cancel();

  const voices = synth.getVoices();
  if (voices.length > 0) {
    doSpeak(t, synth, options?.onEnd, options?.voice);
    return;
  }

  // Mobile: getVoices() often returns [] until after first use. Speak immediately with default
  // (browser picks voice); also listen for voiceschanged so later plays can use a chosen voice.
  doSpeak(t, synth, options?.onEnd, options?.voice);

  let timeoutId: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    timeoutId = null;
    synth.removeEventListener('voiceschanged', once);
  }, 1500);

  const once = () => {
    synth.removeEventListener('voiceschanged', once);
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  synth.addEventListener('voiceschanged', once);
}
