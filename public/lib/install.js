// iOS Safari does not fire `beforeinstallprompt`. The only way to install a
// PWA on iOS is "Share -> Add to Home Screen". This module detects that
// situation and decides whether to nudge the user.

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function shouldShowIOSHint() {
  return isIOS() && !isStandalone() && !localStorage.getItem("lifeos.installHintDismissed");
}

export function dismissIOSHint() {
  localStorage.setItem("lifeos.installHintDismissed", "1");
}
