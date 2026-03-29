/**
 * Base URL for backend API requests.
 *
 * In Vite dev we default to '' so requests go to the same origin (e.g. :5173)
 * and the dev-server proxy forwards /api to the FastAPI backend. This avoids
 * CORS failures when the site is opened as 127.0.0.1 while VITE_API_URL uses localhost, etc.
 *
 * Production: set VITE_API_URL to your deployed API origin.
 */
export function getApiBaseUrl() {
    if (import.meta.env.DEV) {
        return '';
    }
    return import.meta.env.VITE_API_URL || '';
}
