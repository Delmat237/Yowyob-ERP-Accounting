export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  code?: number;
};

export function unwrapApiData<T>(response: ApiEnvelope<T> | undefined, fallbackMessage: string): T {
  if (response?.success === false) {
    throw new Error(response.message || fallbackMessage);
  }
  if (response?.data === undefined || response?.data === null) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}

export function buildCodeFromLibelle(libelle: string, prefix: string): string {
  const normalized = libelle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
    .slice(0, 20);

  return normalized || `${prefix}-${Date.now().toString().slice(-6)}`;
}
