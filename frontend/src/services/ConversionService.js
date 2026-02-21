import axios from 'axios';
import { supabase } from './supabase';

class ConversionService {
    constructor() {
        if (ConversionService.instance) {
            return ConversionService.instance;
        }
        this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        ConversionService.instance = this;
    }

    /**
     * Get auth headers if the user is logged in.
     * @returns {Promise<Object>} Headers object with Authorization if session exists
     */
    async _getAuthHeaders() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                return { 'Authorization': `Bearer ${session.access_token}` };
            }
        } catch (e) {
            // Silently ignore — auth is optional
        }
        return {};
    }

    /**
     * Convert an image file.
     * @param {File} file - The file to convert.
     * @param {string} targetFormat - The target format (png, jpg, gif).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertImage(file, targetFormat) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_format', targetFormat);

        const authHeaders = await this._getAuthHeaders();

        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/convert/image`, formData, {
                responseType: 'blob',
                timeout: 60000,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...authHeaders,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Image conversion failed:", error);
            throw error;
        }
    }

    /**
     * Convert a data file (JSON, CSV, Excel, XML).
     * @param {File} file - The file to convert.
     * @param {string} targetFormat - The target format (json, csv, xlsx, xml).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertData(file, targetFormat) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_format', targetFormat);

        const authHeaders = await this._getAuthHeaders();

        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/convert/data`, formData, {
                responseType: 'blob',
                timeout: 60000,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...authHeaders,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Data conversion failed:", error);
            throw error;
        }
    }

    /**
     * Convert a document (PDF, DOCX).
     * @param {File} file - The file to convert.
     * @param {string} sourceFormat - The source format.
     * @param {string} targetFormat - The target format.
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertDocument(file, sourceFormat, targetFormat) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('source_format', sourceFormat);
        formData.append('target_format', targetFormat);

        const authHeaders = await this._getAuthHeaders();

        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/convert/document`, formData, {
                responseType: 'blob',
                timeout: 60000,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...authHeaders,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Document conversion failed:", error);
            throw error;
        }
    }

    /**
     * Merge multiple PDF documents.
     * @param {File[]} files - The list of PDF files to merge.
     * @returns {Promise<Blob>} - The merged PDF blob.
     */
    async mergeDocuments(files) {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        const authHeaders = await this._getAuthHeaders();

        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/convert/merge`, formData, {
                responseType: 'blob',
                timeout: 60000,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...authHeaders,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Document merge failed:", error);
            throw error;
        }
    }

    /**
     * OCR a scanned PDF to editable DOCX.
     * @param {File} file - The scanned PDF file.
     * @returns {Promise<Blob>} - The DOCX blob.
     */
    async ocrPdf(file) {
        const formData = new FormData();
        formData.append('file', file);

        const authHeaders = await this._getAuthHeaders();

        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/convert/ocr`, formData, {
                responseType: 'blob',
                timeout: 120000, // OCR can be slow on multi-page PDFs
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...authHeaders,
                },
            });
            return response.data;
        } catch (error) {
            console.error("OCR conversion failed:", error);
            throw error;
        }
    }
}

const conversionService = new ConversionService();
export default conversionService;
