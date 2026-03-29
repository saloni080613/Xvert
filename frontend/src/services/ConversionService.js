import axios from 'axios';
import { supabase } from './supabase';
import { getApiBaseUrl } from '../config/api';

class ConversionService {
    constructor() {
        if (ConversionService.instance) {
            return ConversionService.instance;
        }
        this.apiBaseUrl = getApiBaseUrl();
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

    async _postFormBlob(path, formData) {
        const auth = await this._getAuthHeaders();
        try {
            const { data } = await axios.post(`${this.apiBaseUrl}${path}`, formData, {
                responseType: 'blob',
                headers: { ...auth },
            });
            return data;
        } catch (err) {
            const payload = err.response?.data;
            if (payload instanceof Blob) {
                const text = await payload.text();
                try {
                    const j = JSON.parse(text);
                    const detail = j.detail;
                    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail ?? text));
                } catch (parseErr) {
                    if (parseErr instanceof SyntaxError) {
                        throw new Error(text || err.message);
                    }
                    throw parseErr;
                }
            }
            throw err;
        }
    }

    /**
     * Convert an image file.
     * @param {File} file - The file to convert.
     * @param {string} targetFormat - The target format (png, jpg, gif).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertImage(file, targetFormat, cloudUrl = null) {
        const fd = new FormData();
        fd.append('target_format', targetFormat);
        if (cloudUrl) {
            fd.append('cloud_url', cloudUrl);
            if (file?.name) fd.append('filename', file.name);
        } else if (file) {
            fd.append('file', file);
        } else {
            throw new Error('convertImage: file or cloudUrl required');
        }
        return this._postFormBlob('/api/convert/image', fd);
    }

    /**
     * Convert a data file (JSON, CSV, Excel, XML).
     * @param {File} file - The file to convert.
     * @param {string} targetFormat - The target format (json, csv, xlsx, xml).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertData(file, targetFormat, cloudUrl = null) {
        const fd = new FormData();
        fd.append('target_format', targetFormat);
        if (cloudUrl) {
            fd.append('cloud_url', cloudUrl);
            if (file?.name) fd.append('filename', file.name);
        } else if (file) {
            fd.append('file', file);
        } else {
            throw new Error('convertData: file or cloudUrl required');
        }
        return this._postFormBlob('/api/convert/data', fd);
    }

    /**
     * Convert a document (PDF, DOCX, Image→PDF, etc.).
     * @param {File} file - The file to convert.
     * @param {string} sourceFormat - The source format.
     * @param {string} targetFormat - The target format.
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertDocument(file, sourceFormat, targetFormat, cloudUrl = null) {
        const fd = new FormData();
        fd.append('source_format', sourceFormat);
        fd.append('target_format', targetFormat);
        if (cloudUrl) {
            fd.append('cloud_url', cloudUrl);
            if (file?.name) fd.append('filename', file.name);
        } else if (file) {
            fd.append('file', file);
        } else {
            throw new Error('convertDocument: file or cloudUrl required');
        }
        return this._postFormBlob('/api/convert/document', fd);
    }

    /**
     * Merge multiple PDF documents.
     * @param {File[]} files - The list of PDF files to merge.
     * @returns {Promise<Blob>} - The merged PDF blob.
     */
    async mergeDocuments(files) {
        if (!files?.length || files.length < 2) {
            throw new Error('mergeDocuments: at least two PDF files required');
        }
        const fd = new FormData();
        for (const f of files) {
            fd.append('files', f);
        }
        return this._postFormBlob('/api/convert/merge', fd);
    }

    /**
     * Convert a file from a remote URL.
     * @param {string} url - The URL of the file to fetch and convert.
     * @param {string} targetFormat - The target format.
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async remoteConvert(url, targetFormat) {
        const fd = new FormData();
        fd.append('url', url);
        if (targetFormat) {
            fd.append('target_format', targetFormat);
        }
        return this._postFormBlob('/api/convert/remote-fetch', fd);
    }
}

const conversionService = new ConversionService();
export default conversionService;
