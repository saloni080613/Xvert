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

    _createMockBlob(targetFormat) {
        const b64toBlob = (b64Data, contentType='') => {
            const byteCharacters = atob(b64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            return new Blob([new Uint8Array(byteNumbers)], {type: contentType});
        };

        const tf = (targetFormat || 'pdf').toLowerCase();
        if (tf === 'pdf') {
            return b64toBlob('JVBERi0xLjcKCjEgMCBvYmogICUKPDwKL1BhZ2VzIDIgMCBSCi9UeXBlIC9DYXRhbG9nCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbIDMgMCBSIF0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Cj4+Ci9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0KPj4KZW5kb2JqCgp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE2IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNAovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMTc5CiUlRU9GCg==', 'application/pdf');
        } else if (tf === 'png') {
            return b64toBlob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'image/png');
        } else if (tf === 'jpg' || tf === 'jpeg') {
            return b64toBlob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'image/jpeg');
        } else if (tf === 'gif') {
            return b64toBlob('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'image/gif');
        } else if (tf === 'json') {
            return new Blob(['{\n  "mock": "data",\n  "status": "success"\n}'], { type: 'application/json' });
        } else if (tf === 'csv') {
            return new Blob(['Column1,Column2\nValue1,Value2\nValue3,Value4'], { type: 'text/csv' });
        } else if (tf === 'xml') {
            return new Blob(['<?xml version="1.0" encoding="UTF-8"?><root><mock>data</mock></root>'], { type: 'application/xml' });
        } else {
            return new Blob([`Mock conversion to ${targetFormat}`], { type: 'text/plain' });
        }
    }

    /**
     * Convert an image file.
     * @param {File} file - The file to convert.
     * @param {string} targetFormat - The target format (png, jpg, gif).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertImage(file, targetFormat, cloudUrl = null) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this._createMockBlob(targetFormat));
            }, 1000);
        });
    }

    /**
     * Convert a data file (JSON, CSV, Excel, XML).
     * @param {File} file - The file to convert.
     * @param {string} targetFormat - The target format (json, csv, xlsx, xml).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertData(file, targetFormat, cloudUrl = null) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this._createMockBlob(targetFormat));
            }, 1000);
        });
    }

    /**
     * Convert a document (PDF, DOCX).
     * @param {File} file - The file to convert.
     * @param {string} sourceFormat - The source format.
     * @param {string} targetFormat - The target format.
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertDocument(file, sourceFormat, targetFormat, cloudUrl = null) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this._createMockBlob(targetFormat));
            }, 1000);
        });
    }

    /**
     * Merge multiple PDF documents.
     * @param {File[]} files - The list of PDF files to merge.
     * @returns {Promise<Blob>} - The merged PDF blob.
     */
    async mergeDocuments(files) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this._createMockBlob('pdf'));
            }, 1000);
        });
    }

    /**

     * Convert a file from a remote URL.
     * @param {string} url - The URL of the file to fetch and convert.
     * @param {string} targetFormat - The target format.
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async remoteConvert(url, targetFormat) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this._createMockBlob(targetFormat));
            }, 1000);
        });
    }
}

const conversionService = new ConversionService();
export default conversionService;
