import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface AttachmentDto {
    id: string;
    originalFilename: string;
    contentType: string;
    size: number;
    url: string;
    uploadedAt: string;
}

export interface ApiResponseWrapperAttachmentDto {
    success: boolean;
    data?: AttachmentDto;
    message?: string;
}

export class AccountingAttachmentService {
    /**
     * Upload a generic file attachment
     * @param formData
     * @returns ApiResponseWrapperAttachmentDto OK
     * @throws ApiError
     */
    public static uploadAttachment(
        formData?: {
            file: Blob | File;
        },
    ): Promise<ApiResponseWrapperAttachmentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounting/attachments/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }

    /**
     * Get the download URL for a file
     * @param fileName
     * @returns string
     */
    public static getDownloadUrl(fileName: string): string {
        return `${OpenAPI.BASE || ''}/api/accounting/attachments/download/${fileName}`;
    }

    public static async downloadAttachmentBlob(fileName: string): Promise<Blob> {
        const token =
            typeof window !== 'undefined'
                ? localStorage.getItem('auth_token')
                : null;
        const organizationId =
            typeof window !== 'undefined'
                ? localStorage.getItem('organization_id')
                : null;
        const tenantId =
            typeof window !== 'undefined'
                ? localStorage.getItem('tenant_id') ?? '11111111-1111-1111-1111-111111111111'
                : null;

        const response = await fetch(this.getDownloadUrl(fileName), {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(organizationId ? { 'X-Organization-Id': organizationId } : {}),
                ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
            },
        });

        if (!response.ok) {
            throw new Error("Impossible de charger la pièce jointe.");
        }

        return response.blob();
    }
}
