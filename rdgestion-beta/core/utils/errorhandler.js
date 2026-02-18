// ============================================================================
// GESTIONNAIRE D'ERREURS
// Traduction et formatage des erreurs Supabase
// ============================================================================

import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Classe pour gérer les erreurs de l'application
 */
export class AppError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', originalError = null) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.originalError = originalError;
        this.timestamp = new Date();
    }
}

/**
 * Traduit les erreurs Supabase en messages français
 * @param {Error} error - Erreur Supabase
 * @returns {AppError}
 */
export function handleSupabaseError(error) {
    if (!error) {
        return new AppError(ERROR_MESSAGES.UNKNOWN_ERROR, 'UNKNOWN_ERROR');
    }

    // Erreurs d'authentification
    if (error.message?.includes('Invalid login credentials')) {
        return new AppError('Email ou mot de passe incorrect', 'AUTH_INVALID_CREDENTIALS', error);
    }
    
    if (error.message?.includes('Email not confirmed')) {
        return new AppError('Veuillez confirmer votre email', 'AUTH_EMAIL_NOT_CONFIRMED', error);
    }
    
    if (error.message?.includes('User not found')) {
        return new AppError('Utilisateur non trouvé', 'AUTH_USER_NOT_FOUND', error);
    }

    // Erreurs de permissions (RLS)
    if (error.code === '42501' || error.message?.includes('permission denied')) {
        return new AppError('Accès refusé. Vous n\'avez pas les droits nécessaires.', 'PERMISSION_DENIED', error);
    }

    // Erreurs de contraintes
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
        return new AppError('Cette valeur existe déjà (doublon)', 'DUPLICATE_KEY', error);
    }
    
    if (error.code === '23503' || error.message?.includes('foreign key')) {
        return new AppError('Impossible de supprimer : des éléments dépendent de cet enregistrement', 'FOREIGN_KEY_VIOLATION', error);
    }
    
    if (error.code === '23502' || error.message?.includes('null value')) {
        return new AppError('Un champ obligatoire est manquant', 'NOT_NULL_VIOLATION', error);
    }

    // Erreurs réseau
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        return new AppError('Erreur de connexion. Vérifiez votre réseau.', 'NETWORK_ERROR', error);
    }

    // Erreurs métier (depuis les triggers)
    if (error.message?.includes('période clôturée')) {
        return new AppError(ERROR_MESSAGES.PERIODE_CLOSED, 'PERIODE_CLOSED', error);
    }

    // Erreur générique
    return new AppError(
        error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        error.code || 'UNKNOWN_ERROR',
        error
    );
}

/**
 * Affiche une erreur dans la console (mode développement)
 * @param {Error} error - Erreur à logger
 * @param {string} context - Contexte de l'erreur
 */
export function logError(error, context = '') {
    console.group(`❌ Erreur${context ? ` - ${context}` : ''}`);
    console.error('Message:', error.message);
    console.error('Code:', error.code || 'N/A');
    if (error.originalError) {
        console.error('Erreur originale:', error.originalError);
    }
    console.error('Stack:', error.stack);
    console.groupEnd();
}

/**
 * Affiche un message d'erreur à l'utilisateur
 * @param {Error|string} error - Erreur ou message
 * @param {HTMLElement} container - Élément DOM où afficher l'erreur
 */
export function displayError(error, container = null) {
    const message = typeof error === 'string' ? error : error.message;
    
    if (container) {
        container.innerHTML = `
            <div class="error-message" role="alert">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
            </div>
        `;
        container.style.display = 'block';
        
        // Auto-masquer après 5 secondes
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

/**
 * Affiche un message de succès
 * @param {string} message - Message de succès
 * @param {HTMLElement} container - Élément DOM
 */
export function displaySuccess(message, container = null) {
    if (container) {
        container.innerHTML = `
            <div class="success-message" role="status">
                <span class="success-icon">✅</span>
                <span class="success-text">${message}</span>
            </div>
        `;
        container.style.display = 'block';
        
        setTimeout(() => {
            container.style.display = 'none';
        }, 3000);
    }
}

/**
 * Enveloppe une fonction async avec gestion d'erreur
 * @param {Function} fn - Fonction à exécuter
 * @param {Function} errorCallback - Callback en cas d'erreur
 */
export async function withErrorHandling(fn, errorCallback = null) {
    try {
        return await fn();
    } catch (error) {
        const appError = handleSupabaseError(error);
        logError(appError);
        
        if (errorCallback) {
            errorCallback(appError);
        }
        
        throw appError;
    }
}