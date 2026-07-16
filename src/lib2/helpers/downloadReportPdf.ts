import { OpenAPI } from '../core/OpenAPI';

/**
 * Télécharge un rapport PDF du backend accounting en Blob, avec la MÊME base URL,
 * le MÊME token et les MÊMES en-têtes org/tenant que le reste du client lib2.
 *
 * Corrige le bug d'export PDF : les pages faisaient un `fetch` brut vers une base
 * différente (`NEXT_PUBLIC_API_BASE_URL` → repli `http://localhost:8081`, sans le
 * préfixe `/accounting-api`) et sans en-têtes d'authentification, d'où « Failed to fetch ».
 *
 * @param path chemin de l'endpoint (ex. "/api/accounting/rapport/grand-livre/export/pdf")
 */
export async function downloadReportPdfBlob(
    path: string,
    dateDebut: string,
    dateFin: string,
): Promise<Blob> {
    if (typeof window === 'undefined') {
        throw new Error("L'export PDF n'est disponible que côté client.");
    }

    const base = (OpenAPI.BASE || '').replace(/\/+$/, '');
    const params = new URLSearchParams({ date_debut: dateDebut, date_fin: dateFin });
    const url = `${base}${path}?${params.toString()}`;

    // Mêmes clés/fallbacks que OpenAPI.TOKEN et OpenAPI.HEADERS (client lib2).
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id')
        || process.env.NEXT_PUBLIC_TENANT_ID
        || '11111111-1111-1111-1111-111111111111';
    const organizationId = localStorage.getItem('organization_id')
        || process.env.NEXT_PUBLIC_ORGANIZATION_ID
        || '4e177ff2-89b8-4d24-926a-5763dfa1b19a';

    const response = await fetch(url, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'X-Tenant-Id': tenantId,
            'X-Organization-Id': organizationId,
            Accept: 'application/pdf',
        },
    });

    if (!response.ok) {
        throw new Error(`Échec de l'export PDF (HTTP ${response.status})`);
    }

    return response.blob();
}
