import axios from 'axios';

class ConversionService {
    constructor() {
        if (ConversionService.instance) {
            return ConversionService.instance;
        }
        this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        ConversionService.instance = this;
    }

    /**
     * Convert an image file.
     * @param {File} file - The file to convert.
     * @param {string} targetFormat - The target format (png, jpg, gif).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertImage(file, targetFormat, cloudUrl = null) {
        const formData = new FormData();
        if (cloudUrl) {
            formData.append('cloud_url', cloudUrl);
            formData.append('filename', file.name);
        } else {
            formData.append('file', file);
        }
        formData.append('target_format', targetFormat);

        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/convert/image`, formData, {
                responseType: 'blob',
                timeout: 60000, // 60 seconds
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error("Image conversion failed:", error);
            throw error;
        }
    }

    /**
     * Convert a data file (JSON, CSV, Excel).
     * @param {File} file - The file to convert.
     * @param {string} targetFormat - The target format (json, csv, xlsx, xml).
     * @returns {Promise<Blob>} - The converted file blob.
     */
    async convertData(file, targetFormat, cloudUrl = null) {
        const formData = new FormData();
        if (cloudUrl) {
            formData.append('cloud_url', cloudUrl);
            formData.append('filename', file.name);
        } else {
            formData.append('file', file);
        }
        formData.append('target_format', targetFormat);

        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/convert/data`, formData, {
                responseType: 'blob',
                timeout: 60000, // 60 seconds
                headers: {
                    'Content-Type': 'multipart/form-data',
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
    async convertDocument(file, sourceFormat, targetFormat, cloudUrl = null) {
        const formData = new FormData();
        if (cloudUrl) {
            formData.append('cloud_url', cloudUrl);
            formData.append('filename', file.name);
        } else {
            formData.append('file', file);
        }
        formData.append('source_format', sourceFormat);
        formData.append('target_format', targetFormat);

        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/convert/document`, formData, {
                responseType: 'blob',
                timeout: 60000, // 60 seconds
                headers: {
                    'Content-Type': 'multipart/form-data',
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
            if (file.link) {
                // If it's a Dropbox file object, append the URL and filename
                formData.append('cloud_urls', file.link);
                formData.append('filenames', file.name);
            } else {
                formData.append('files', file);
            }
        });

        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/convert/merge`, formData, {
                responseType: 'blob',
                timeout: 60000, // 60 seconds
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error("Document merge failed:", error);
            throw error;
        }
    }
}

const conversionService = new ConversionService();
export default conversionService;
