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
     * @param {string} cloudUrl - Optional cloud URL.
     * @param {Object} options - Optional image tweaks (privacyMode, width, height, quality).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertImage(file, targetFormat, cloudUrl = null, options = {}) {
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

        // Add optional tweaks
        if (options.privacyMode) fd.append('privacy_mode', true);
        if (options.width) fd.append('width', options.width);
        if (options.height) fd.append('height', options.height);
        if (options.quality) fd.append('quality', options.quality);

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
     * @param {string} cloudUrl - Optional cloud URL.
     * @param {Object} options - Optional document tweaks (pageRange, compress).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertDocument(file, sourceFormat, targetFormat, cloudUrl = null, options = {}) {
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

        // Add optional tweaks
        if (options.pageRange) fd.append('page_range', options.pageRange);
        if (options.compress) fd.append('compress', true);

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
     * @param {Object} options - Optional tweaks.
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async remoteConvert(url, targetFormat, options = {}) {
        const fd = new FormData();
        fd.append('url', url);
        if (targetFormat) {
            fd.append('target_format', targetFormat);
        }

        // Add optional tweaks (Backend supports them for images and documented routes)
        if (options.privacyMode) fd.append('privacy_mode', true);
        if (options.width) fd.append('width', options.width);
        if (options.height) fd.append('height', options.height);
        if (options.quality) fd.append('quality', options.quality);
        if (options.pageRange) fd.append('page_range', options.pageRange);
        if (options.compress) fd.append('compress', true);

        return this._postFormBlob('/api/convert/remote-fetch', fd);
    }
}

const conversionService = new ConversionService();
export default conversionService;
