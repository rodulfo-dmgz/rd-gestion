// ============================================================================
// CONFIGURATION SUPABASE - RD GESTION
// Client unique pour toute l'application (Singleton Pattern)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_CONFIG } from './config.js';
import { navigateTo, getLoginPath } from '../utils/Pathutils.js';

// ============================================================================
// CRÉATION DU CLIENT SUPABASE (SINGLETON)
// ============================================================================

let supabaseInstance = null;

export function getSupabaseClient() {
    if (!supabaseInstance) {
        // Vérification : s'assurer que les clés existent
        if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.SUPABASE_URL || !SUPABASE_CONFIG.SUPABASE_ANON_KEY) {
            console.error('❌ ERREUR : Configuration Supabase manquante ou incorrecte !');
            console.error('👉 Vérifie le fichier core/config/config.js');
            console.error('👉 Assure-toi que SUPABASE_URL et SUPABASE_ANON_KEY sont bien définis');
            throw new Error('Configuration Supabase manquante. Vérifiez core/config/config.js');
        }
        
        supabaseInstance = createClient(
            SUPABASE_CONFIG.SUPABASE_URL,
            SUPABASE_CONFIG.SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    flowType: 'pkce'
                }
            }
        );

        console.log('✅ Client Supabase initialisé');
    }
    
    return supabaseInstance;
}

export const supabase = getSupabaseClient();

// ============================================================================
// HELPERS D'AUTHENTIFICATION
// ============================================================================

/**
 * Récupère l'utilisateur actuellement connecté
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
        return null;
    }
    
    return user;
}

/**
 * Récupère la session active
 * @returns {Promise<Object|null>}
 */
export async function getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('❌ Erreur lors de la récupération de la session:', error);
        return null;
    }
    
    return session;
}

/**
 * Vérifie si un utilisateur est authentifié
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Déconnexion complète (Supabase + localStorage)
 * Redirige vers la page de connexion
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
        throw error;
    }

    // Nettoyage du localStorage
    localStorage.removeItem('user_profile');
    localStorage.removeItem('current_entreprise');

    console.log('✅ Déconnexion réussie');
    
    // Redirection vers login avec chemin dynamique
    navigateTo('/index.html');
}

/**
 * Écoute les changements d'état d'authentification
 * @param {Function} callback - Fonction appelée à chaque changement
 * @returns {Object} - Subscription (pour unsubscribe)
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Changement auth:', event);
        callback(event, session);
    });
}

/**
 * Middleware d'authentification
 * Vérifie la session et le rôle, redirige si non autorisé
 * 
 * @param {string[]} allowedRoles - Rôles autorisés (vide = tous les rôles)
 * @returns {Promise<Object>} - Le profil utilisateur si autorisé
 * @throws {Error} - Si non authentifié ou non autorisé
 * 
 * @example
 * // Dans une page admin
 * const profile = await requireAuth(['admin', 'formateur']);
 * 
 * @example
 * // Dans une page accessible à tous les connectés
 * const profile = await requireAuth();
 */
export async function requireAuth(allowedRoles = []) {
    const session = await getCurrentSession();
    
    if (!session) {
        console.warn('⚠️ Aucune session active, redirection vers login');
        navigateTo('/index.html');
        throw new Error('Non authentifié');
    }

    const profileStr = localStorage.getItem('user_profile');
    
    if (!profileStr) {
        console.warn('⚠️ Profil non trouvé, redirection vers login');
        navigateTo('/index.html');
        throw new Error('Profil non trouvé');
    }

    const profile = JSON.parse(profileStr);

    // Vérification du rôle si des rôles sont spécifiés
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
        console.error('❌ Accès refusé - Rôle non autorisé:', profile.role);
        alert('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
        navigateTo('/index.html');
        throw new Error('Accès refusé');
    }

    return profile;
}

/**
 * Récupère le profil utilisateur depuis localStorage
 * @returns {Object|null}
 */
export function getUserProfile() {
    const profileStr = localStorage.getItem('user_profile');
    return profileStr ? JSON.parse(profileStr) : null;
}

/**
 * Récupère l'entreprise courante depuis localStorage
 * @returns {Object|null}
 */
export function getCurrentEntreprise() {
    const entrepriseStr = localStorage.getItem('current_entreprise');
    return entrepriseStr ? JSON.parse(entrepriseStr) : null;
}

// Export par défaut
export default supabase;