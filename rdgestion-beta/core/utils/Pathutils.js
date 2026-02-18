// ============================================================================
// GESTION DES CHEMINS - RD GESTION
// Utilitaire pour gérer les chemins en local et sur GitHub Pages
// ============================================================================

/**
 * Détecte si l'application tourne sur GitHub Pages
 * @returns {boolean}
 */
export function isGitHubPages() {
    return window.location.hostname === 'rodulfo-dmgz.github.io';
}

/**
 * Retourne le chemin de base de l'application
 * - En local : '' (racine)
 * - Sur GitHub Pages : '/rd-gestion/rdgestion-beta'
 * @returns {string}
 */
export function getBasePath() {
    return isGitHubPages() ? '/rd-gestion/rdgestion-beta' : '';
}

/**
 * Construit un chemin absolu compatible avec l'environnement
 * @param {string} path - Chemin relatif à la racine du projet (ex: '/index.html')
 * @returns {string} - Chemin complet
 * 
 * @example
 * buildPath('/index.html') 
 * // Local: '/index.html'
 * // GitHub Pages: '/rd-gestion/rdgestion-beta/index.html'
 * 
 * @example
 * buildPath('/roles/admin/index-admin.html')
 * // Local: '/roles/admin/index-admin.html'
 * // GitHub Pages: '/rd-gestion/rdgestion-beta/roles/admin/index-admin.html'
 */
export function buildPath(path) {
    // S'assurer que le chemin commence par /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${getBasePath()}${normalizedPath}`;
}

/**
 * Redirige vers une page en tenant compte de l'environnement
 * @param {string} path - Chemin relatif à la racine du projet
 */
export function navigateTo(path) {
    window.location.href = buildPath(path);
}

/**
 * Retourne le chemin vers la page de connexion
 * @returns {string}
 */
export function getLoginPath() {
    return buildPath('/index.html');
}

/**
 * Retourne les chemins des dashboards par rôle
 * @returns {Object}
 */
export function getDashboardPaths() {
    return {
        admin: buildPath('/roles/admin/index-admin.html'),
        formateur: buildPath('/roles/admin/index-admin.html'),
        stagiaire_ca: buildPath('/roles/ca/index-ca.html'),
        stagiaire_gcf: buildPath('/roles/gcf/index-gcf.html')
    };
}

/**
 * Configuration des chemins de l'application
 */
export const APP_PATHS = {
    // Authentification
    LOGIN: '/index.html',
    PASSWORD_RESET: '/app/auth/password-reset.html',
    UPDATE_PASSWORD: '/app/auth/update-password.html',
    
    // Dashboards par rôle
    DASHBOARD_ADMIN: '/roles/admin/index-admin.html',
    DASHBOARD_CA: '/roles/ca/index-ca.html',
    DASHBOARD_GCF: '/roles/gcf/index-gcf.html',
    
    // Assets
    LOGO: '/assets/images/logo.svg',
    ICON: '/assets/icons/icon.svg',
    
    // CSS
    MAIN_CSS: '/css/main.css',
    
    // Core
    SUPABASE_CONFIG: '/core/config/supabase.js',
    CONFIG: '/core/config/config.js'
};

// Export par défaut pour faciliter l'import
export default {
    isGitHubPages,
    getBasePath,
    buildPath,
    navigateTo,
    getLoginPath,
    getDashboardPaths,
    APP_PATHS
};