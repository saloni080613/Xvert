/**
 * HistoryService
 * ==============
 * Queries the Supabase `conversions` table directly (RLS ensures per-user filtering)
 * and generates signed download URLs from Supabase Storage.
 */

import { supabase } from './supabase'
import { getApiBaseUrl } from '../config/api'

const historyService = {
    /**
     * Fetch the authenticated user's conversion history, newest first.
     * @returns {Promise<Array>} List of conversion records
     */
    getHistory: async () => {
        const { data, error } = await supabase
            .from('conversions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error
        return data || []
    },

    /**
     * Delete a conversion record.
     * The backend history router also handles storage file cleanup.
     * @param {string} id - Conversion UUID
     */
    deleteConversion: async (id) => {
        const apiUrl = getApiBaseUrl()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.access_token) throw new Error('Not authenticated')

        const response = await fetch(`${apiUrl}/api/history/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
            },
        })

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.detail || 'Failed to delete')
        }
    },

    /**
     * Get a signed download URL for a converted file.
     * @param {string} conversionId - Conversion UUID
     * @returns {Promise<{download_url: string, filename: string}>}
     */
    getDownloadUrl: async (conversionId) => {
        const apiUrl = getApiBaseUrl()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.access_token) throw new Error('Not authenticated')

        const response = await fetch(`${apiUrl}/api/history/${conversionId}/download`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
            },
        })

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.detail || 'Failed to get download URL')
        }

        return await response.json()
    },
}

export default historyService
