// ============================================================================
// SERVICE AUTHENTIFICATION
// Gestion connexion, déconnexion, session utilisateur
// ============================================================================

import { supabase, getCurrentUser, getCurrentSession } from '../config/supabase.js';
import { TABLES, ROLES } from '../config/constants.js';
import { handleSupabaseError, logError } from '../utils/errorhandler.js';

/**
 * Service d'authentification
 */
class AuthService {
    constructor() {
        this.currentUser = null;
        this.currentSession = null;
    }

    // ========================================================================
    // AUTHENTIFICATION
    // ========================================================================

    /**
     * Connexion avec email et mot de passe
     * @param {string} email - Email
     * @param {string} password - Mot de passe
     * @returns {Promise<Object>} - {user, session, profile}
     */
    async signIn(email, password) {
        try {
            // 1. Connexion Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            // 2. Récupérer le profil utilisateur depuis la table users
            const { data: profile, error: profileError } = await supabase
                .from(TABLES.USERS)
                .select('*')
                .eq('email', email)
                .single();

            if (profileError) throw profileError;

            // 3. Vérifier que l'utilisateur est actif
            if (!profile.actif) {
                await this.signOut();
                throw new Error('Compte désactivé. Contactez un administrateur.');
            }

            // 4. Mettre à jour la dernière connexion
            await supabase
                .from(TABLES.USERS)
                .update({ derniere_connexion: new Date().toISOString() })
                .eq('id', profile.id);

            // 5. Stocker en local
            this.currentUser = authData.user;
            this.currentSession = authData.session;

            return {
                user: authData.user,
                session: authData.session,
                profile
            };
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.signIn');
            throw appError;
        }
    }

    /**
     * Déconnexion
     * @returns {Promise<void>}
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) throw error;

            this.currentUser = null;
            this.currentSession = null;

            // Rediriger vers la page de connexion
            window.location.href = '/index.html';
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.signOut');
            throw appError;
        }
    }

    /**
     * Inscription d'un nouvel utilisateur (Admin uniquement)
     * @param {Object} userData - Données utilisateur
     * @returns {Promise<Object>}
     */
    async signUp(userData) {
        try {
            const { email, password, nom, prenom, role, metier } = userData;

            // 1. Créer le compte Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) throw authError;

            // 2. Créer l'entrée dans la table users
            const { data: profile, error: profileError } = await supabase
                .from(TABLES.USERS)
                .insert({
                    id: authData.user.id,
                    email,
                    nom,
                    prenom,
                    role,
                    metier,
                    mot_de_passe_hash: 'managed_by_supabase_auth'
                })
                .select()
                .single();

            if (profileError) throw profileError;

            return {
                user: authData.user,
                profile
            };
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.signUp');
            throw appError;
        }
    }

    // ========================================================================
    // SESSION
    // ========================================================================

    /**
     * Récupère la session active
     * @returns {Promise<Object|null>}
     */
    async getSession() {
        try {
            const session = await getCurrentSession();
            this.currentSession = session;
            return session;
        } catch (error) {
            logError(error, 'authService.getSession');
            return null;
        }
    }

    /**
     * Rafraîchit la session
     * @returns {Promise<Object>}
     */
    async refreshSession() {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) throw error;

            this.currentSession = data.session;
            return data.session;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.refreshSession');
            throw appError;
        }
    }

    /**
     * Vérifie si l'utilisateur est connecté
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        const session = await this.getSession();
        return session !== null;
    }

    // ========================================================================
    // PROFIL UTILISATEUR
    // ========================================================================

    /**
     * Récupère le profil de l'utilisateur connecté
     * @returns {Promise<Object|null>}
     */
    async getUserProfile() {
        try {
            const user = await getCurrentUser();
            
            if (!user) return null;

            const { data, error } = await supabase
                .from(TABLES.USERS)
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            logError(error, 'authService.getUserProfile');
            return null;
        }
    }

    /**
     * Met à jour le profil utilisateur
     * @param {Object} updates - Données à mettre à jour
     * @returns {Promise<Object>}
     */
    async updateProfile(updates) {
        try {
            const user = await getCurrentUser();
            
            if (!user) throw new Error('Utilisateur non connecté');

            // Ne pas permettre de modifier le rôle soi-même
            const { role, ...allowedUpdates } = updates;

            const { data, error } = await supabase
                .from(TABLES.USERS)
                .update(allowedUpdates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.updateProfile');
            throw appError;
        }
    }

    /**
     * Change le mot de passe
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<void>}
     */
    async changePassword(newPassword) {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.changePassword');
            throw appError;
        }
    }

    // ========================================================================
    // AUTORISATIONS (RBAC)
    // ========================================================================

    /**
     * Vérifie si l'utilisateur a un rôle spécifique
     * @param {string} role - Rôle à vérifier
     * @returns {Promise<boolean>}
     */
    async hasRole(role) {
        const profile = await this.getUserProfile();
        return profile?.role === role;
    }

    /**
     * Vérifie si l'utilisateur est admin
     * @returns {Promise<boolean>}
     */
    async isAdmin() {
        return await this.hasRole(ROLES.ADMIN);
    }

    /**
     * Vérifie si l'utilisateur est formateur
     * @returns {Promise<boolean>}
     */
    async isFormateur() {
        const profile = await this.getUserProfile();
        return profile?.role === ROLES.FORMATEUR || profile?.role === ROLES.ADMIN;
    }

    /**
     * Vérifie si l'utilisateur est stagiaire
     * @returns {Promise<boolean>}
     */
    async isStagiaire() {
        return await this.hasRole(ROLES.STAGIAIRE);
    }

    /**
     * Vérifie si l'utilisateur peut accéder à une ressource
     * @param {string} requiredRole - Rôle requis
     * @returns {Promise<boolean>}
     */
    async canAccess(requiredRole) {
        const profile = await this.getUserProfile();
        
        if (!profile) return false;

        // Admin a accès à tout
        if (profile.role === ROLES.ADMIN) return true;

        // Formateur a accès à formateur et stagiaire
        if (profile.role === ROLES.FORMATEUR) {
            return requiredRole === ROLES.FORMATEUR || requiredRole === ROLES.STAGIAIRE;
        }

        // Stagiaire a accès uniquement à stagiaire
        return profile.role === requiredRole;
    }

    // ========================================================================
    // RÉINITIALISATION MOT DE PASSE
    // ========================================================================

    /**
     * Demande de réinitialisation de mot de passe
     * @param {string} email - Email
     * @returns {Promise<void>}
     */
    async requestPasswordReset(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.requestPasswordReset');
            throw appError;
        }
    }

    /**
     * Réinitialise le mot de passe avec un token
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<void>}
     */
    async resetPassword(newPassword) {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.resetPassword');
            throw appError;
        }
    }

    // ========================================================================
    // GESTION UTILISATEURS (ADMIN)
    // ========================================================================

    /**
     * Liste tous les utilisateurs (Admin uniquement)
     * @returns {Promise<Array>}
     */
    async getAllUsers() {
        try {
            const { data, error } = await supabase
                .from(TABLES.USERS)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.getAllUsers');
            throw appError;
        }
    }

    /**
     * Active/désactive un utilisateur (Admin uniquement)
     * @param {string} userId - ID utilisateur
     * @param {boolean} actif - Actif ou non
     * @returns {Promise<Object>}
     */
    async toggleUserStatus(userId, actif) {
        try {
            const { data, error } = await supabase
                .from(TABLES.USERS)
                .update({ actif })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.toggleUserStatus');
            throw appError;
        }
    }

    /**
     * Change le rôle d'un utilisateur (Admin uniquement)
     * @param {string} userId - ID utilisateur
     * @param {string} newRole - Nouveau rôle
     * @returns {Promise<Object>}
     */
    async changeUserRole(userId, newRole) {
        try {
            const { data, error } = await supabase
                .from(TABLES.USERS)
                .update({ role: newRole })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'authService.changeUserRole');
            throw appError;
        }
    }
}

// Export singleton
export const authService = new AuthService();
export default authService;