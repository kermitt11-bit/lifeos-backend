// Light haptic feedback. iOS Safari ignores navigator.vibrate but the
// permissionless Web Vibration API works on Android. We keep the call
// site simple and let the platform no-op when unsupported.
const ENABLED = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

export function tap(ms = 8) {
  if (ENABLED) navigator.vibrate(ms);
}

export function success() {
  if (ENABLED) navigator.vibrate([10, 30, 10]);
}

export function warn() {
  if (ENABLED) navigator.vibrate([15, 50, 15, 50]);
}
