const MAIN_SELECTOR = 'main';
const MAX_WAIT_MS = 8000;

function isMainContentPending(main: Element): boolean {
  const text = main.textContent?.trim() ?? '';

  // CustomPageLoader plein écran (overlay fixed)
  const fullscreenLoader = document.querySelector('[class*="fixed"][class*="inset-0"][class*="z-[9998]"]');
  if (fullscreenLoader && /chargement/i.test(fullscreenLoader.textContent ?? '')) {
    return true;
  }

  // Spinner plein écran du layout comptable ou du dashboard
  const centeredSpinners = main.querySelectorAll(
    '.flex.min-h-\\[70vh\\] .animate-spin, .h-full.flex.items-center.justify-center .animate-spin',
  );
  if (centeredSpinners.length > 0 && text.length < 80) {
    return true;
  }

  return false;
}

/** Attend que le contenu principal soit peint avant d'arrêter le loader global. */
export function scheduleNavigationLoadingStop(stopLoading: () => void): () => void {
  const startedAt = performance.now();
  let rafId = 0;
  let cancelled = false;

  const finish = () => {
    if (cancelled) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) stopLoading();
      });
    });
  };

  const tick = () => {
    if (cancelled) return;

    const main = document.querySelector(MAIN_SELECTOR);
    const elapsed = performance.now() - startedAt;

    if (!main || isMainContentPending(main)) {
      if (elapsed < MAX_WAIT_MS) {
        rafId = requestAnimationFrame(tick);
        return;
      }
    }

    finish();
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
