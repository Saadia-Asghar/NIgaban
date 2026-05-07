/**
 * Haptic feedback helpers — subtle physical confirmation on critical
 * interactions. Falls back silently when Vibration API is unsupported.
 *
 *   tap()      — small tap for ordinary button presses
 *   confirm()  — double-pulse for successful action (capture, send, save)
 *   warn()     — staccato burst for caution (countdown reaching zero)
 *   alarm()    — long pulse for emergency (SOS triggered)
 */

const supported = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

export function tap() {
  if (supported()) navigator.vibrate(8);
}

export function confirm() {
  if (supported()) navigator.vibrate([14, 40, 14]);
}

export function warn() {
  if (supported()) navigator.vibrate([24, 40, 24, 40, 24]);
}

export function alarm() {
  if (supported()) navigator.vibrate([60, 30, 60, 30, 200]);
}

export default { tap, confirm, warn, alarm };
