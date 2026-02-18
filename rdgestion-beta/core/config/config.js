// ============================================================================
// CONFIGURATION SUPABASE - RD GESTION
// ============================================================================
// 
// ⚠️  IMPORTANT POUR GITHUB PAGES :
// ─────────────────────────────────────────────────────────────────────────────
// Ce fichier contient les clés API Supabase.
// 
// OPTION 1 : Inclure ce fichier dans Git (recommandé pour app pédagogique)
//            → La clé "anon" est publique par design (Row Level Security)
//            → Assurez-vous que vos RLS sont bien configurées dans Supabase
//
// OPTION 2 : Exclure ce fichier (.gitignore) et le créer manuellement
//            → Plus sécurisé mais nécessite une étape manuelle après clone
//
// Pour obtenir ces valeurs :
// 1. Va sur https://supabase.com/dashboard
// 2. Sélectionne ton projet
// 3. Va dans Settings > API
// 4. Copie "Project URL" et "anon public key"
// ============================================================================

export const SUPABASE_CONFIG = {
    SUPABASE_URL: 'https://iomzcbmyzjwtswrkvxqk.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXpjYm15emp3dHN3cmt2eHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjM4MTAsImV4cCI6MjA4NTc5OTgxMH0.ap4Fk6pxGZgVSAdb6krWbv8CM-Dzw0ZQRcsKPKScSVw'
};

// ============================================================================
// CONFIGURATION DE L'APPLICATION
// ============================================================================

export const APP_CONFIG = {
    // Nom de l'application
    APP_NAME: 'RD GESTION',
    
    // Version
    VERSION: '1.0.0-beta',
    
    // Environnement (détection automatique)
    ENV: window.location.hostname === 'localhost' ? 'development' : 'production',
    
    // GitHub Pages
    GITHUB_PAGES_HOST: 'rodulfo-dmgz.github.io',
    GITHUB_PAGES_BASE: '/rd-gestion/rdgestion-beta',
    
    // Session
    SESSION_TIMEOUT: 3600, // 1 heure en secondes
    
    // Pagination par défaut
    DEFAULT_PAGE_SIZE: 20
};