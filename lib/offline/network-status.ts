import { OpenAPI } from '@/src/lib2/core/OpenAPI';

const FAILURE_THRESHOLD = 2;

let consecutiveNetworkFailures = 0;
let browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let forcedOffline = false;

type NetworkListener = (online: boolean) => void;
const listeners = new Set<NetworkListener>();

function notifyListeners(): void {
  const online = !shouldUseOffline();
  listeners.forEach((listener) => listener(online));
}

export function shouldUseOffline(): boolean {
  if (typeof window === 'undefined') return false;
  if (!browserOnline) return true;
  if (forcedOffline) return true;
  if (consecutiveNetworkFailures >= FAILURE_THRESHOLD) return true;
  return false;
}

export function isBrowserOnline(): boolean {
  return browserOnline;
}

export function reportApiSuccess(): void {
  consecutiveNetworkFailures = 0;
  forcedOffline = false;
  notifyListeners();
}

export function reportApiFailure(isNetwork: boolean): void {
  if (!isNetwork) return;
  consecutiveNetworkFailures += 1;
  if (consecutiveNetworkFailures >= FAILURE_THRESHOLD) {
    forcedOffline = true;
  }
  notifyListeners();
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connexion')) {
      return true;
    }
  }
  return false;
}

export function isApiNetworkResponse(response: { success?: boolean; message?: string } | undefined): boolean {
  if (!response || response.success !== false) return false;
  const msg = (response.message ?? '').toLowerCase();
  return msg.includes('connexion') || msg.includes('réseau') || msg.includes('network');
}

export function isBusinessErrorStatus(status: number): boolean {
  return status === 400 || status === 403 || status === 422;
}

export function isConflictStatus(status: number): boolean {
  return status === 409;
}

export function isRetryableServerStatus(status: number): boolean {
  return status === 500 || status === 502 || status === 503 || status === 504;
}

async function getHealthUrl(): Promise<string> {
  const base = OpenAPI.BASE.replace(/\/$/, '');
  return `${base}/api/health`;
}

export async function probeApiHealth(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    const headers = await (typeof OpenAPI.HEADERS === 'function'
      ? OpenAPI.HEADERS({} as never)
      : Promise.resolve(OpenAPI.HEADERS ?? {}));

    const response = await fetch(await getHealthUrl(), {
      method: 'GET',
      headers: headers as Record<string, string>,
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      reportApiSuccess();
      return true;
    }
    reportApiFailure(true);
    return false;
  } catch {
    reportApiFailure(true);
    return false;
  }
}

export function subscribeNetworkStatus(listener: NetworkListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initNetworkStatus(): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handleOnline = () => {
    browserOnline = true;
    notifyListeners();
    void probeApiHealth();
  };

  const handleOffline = () => {
    browserOnline = false;
    notifyListeners();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function resetNetworkStatusForTests(): void {
  consecutiveNetworkFailures = 0;
  forcedOffline = false;
  browserOnline = true;
}
