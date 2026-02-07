import { supabase } from './supabase';

class AuthService {
    constructor() {
        if (AuthService.instance) {
            return AuthService.instance;
        }
        AuthService.instance = this;
    }

    /**
     * Log in a user with email and password.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{data: any, error: any}>}
     */
    async login(email, password) {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    }

    /**
     * Sign up a new user.
     * @param {string} email
     * @param {string} password
     * @param {string} fullName
     * @returns {Promise<{data: any, error: any}>}
     */
    async signup(email, password, fullName) {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
    }

    /**
     * Log out the current user.
     * @returns {Promise<{error: any}>}
     */
    async logout() {
        return await supabase.auth.signOut();
    }

    /**
     * Send a password reset email.
     * @param {string} email
     * @returns {Promise<{data: any, error: any}>}
     */
    async resetPasswordForEmail(email) {
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
    }

    /**
     * Update the user's password.
     * @param {string} newPassword
     * @returns {Promise<{data: any, error: any}>}
     */
    async updatePassword(newPassword) {
        return await supabase.auth.updateUser({
            password: newPassword
        });
    }

    /**
     * Get the current user session.
     * @returns {Promise<{data: {session: any}, error: any}>}
     */
    async getSession() {
        return await supabase.auth.getSession();
    }

    /**
     * Sign in with Google using OAuth.
     * @returns {Promise<{data: any, error: any}>}
     */
    async loginWithGoogle() {
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
    }
}

const authService = new AuthService();
export default authService;
