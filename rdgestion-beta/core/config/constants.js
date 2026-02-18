// ============================================================================
// CONSTANTES GLOBALES - ERP COMPTABLE
// ============================================================================

export const TABLES = {
    // Authentification
    USERS: 'users',
    SESSIONS: 'sessions',
    
    // Multi-tenant
    ENTREPRISES: 'entreprises',
    EXERCICES: 'exercices',
    PERIODES: 'periodes',
    
    // Comptabilité
    PLAN_COMPTABLE: 'plan_comptable',
    JOURNAUX: 'journaux',
    ECRITURES: 'ecritures',
    LIGNES_ECRITURE: 'lignes_ecriture',
    TAUX_TVA: 'taux_tva',
    
    // Tiers
    CLIENTS: 'clients',
    FOURNISSEURS: 'fournisseurs',
    
    // Catalogue
    CATEGORIES_PRODUITS: 'categories_produits',
    PRODUITS: 'produits',
    
    // Ventes
    DEVIS: 'devis',
    LIGNES_DEVIS: 'lignes_devis',
    FACTURES_CLIENTS: 'factures_clients',
    LIGNES_FACTURE_CLIENT: 'lignes_facture_client',
    AVOIRS_CLIENTS: 'avoirs_clients',
    LIGNES_AVOIR_CLIENT: 'lignes_avoir_client',
    
    // Achats
    FACTURES_FOURNISSEURS: 'factures_fournisseurs',
    LIGNES_FACTURE_FOURNISSEUR: 'lignes_facture_fournisseur',
    AVOIRS_FOURNISSEURS: 'avoirs_fournisseurs',
    LIGNES_AVOIR_FOURNISSEUR: 'lignes_avoir_fournisseur',
    
    // Trésorerie
    MODES_REGLEMENT: 'modes_reglement',
    PAIEMENTS: 'paiements',
    RAPPROCHEMENTS_BANCAIRES: 'rapprochements_bancaires',
    
    // Stocks
    MOUVEMENTS_STOCK: 'mouvements_stock',
    
    // Immobilisations
    CATEGORIES_IMMOBILISATIONS: 'categories_immobilisations',
    IMMOBILISATIONS: 'immobilisations',
    AMORTISSEMENTS: 'amortissements',
    
    // Audit
    AUDIT_LOGS: 'audit_logs'
};

export const ROLES = {
    ADMIN: 'admin',
    FORMATEUR: 'formateur',
    STAGIAIRE: 'stagiaire'
};

export const METIERS = {
    COMPTABLE_ASSISTANT: 'comptable_assistant',
    GESTIONNAIRE_COMPTABLE_FISCAL: 'gestionnaire_comptable_fiscal'
};

export const STATUTS_ECRITURE = {
    BROUILLARD: 'brouillard',
    VALIDE: 'valide',
    LETTRE: 'lettre'
};

export const TYPES_ECRITURE = {
    MANUELLE: 'manuelle',
    FACTURE_CLIENT: 'facture_client',
    FACTURE_FOURNISSEUR: 'facture_fournisseur',
    PAIEMENT: 'paiement',
    AVOIR: 'avoir',
    AMORTISSEMENT: 'amortissement',
    STOCK: 'stock'
};

export const TYPES_JOURNAL = {
    VENTES: 'ventes',
    ACHATS: 'achats',
    BANQUE: 'banque',
    CAISSE: 'caisse',
    OPERATIONS_DIVERSES: 'operations_diverses'
};

export const STATUTS_PAIEMENT = {
    NON_PAYE: 'non_paye',
    PARTIEL: 'partiel',
    PAYE: 'paye'
};

export const STATUTS_DEVIS = {
    EN_ATTENTE: 'en_attente',
    ACCEPTE: 'accepte',
    REFUSE: 'refuse',
    TRANSFORME: 'transforme'
};

export const TYPES_PAIEMENT = {
    ENCAISSEMENT: 'encaissement',
    REGLEMENT: 'reglement'
};

export const TYPES_REGLEMENT = {
    CHEQUE: 'cheque',
    VIREMENT: 'virement',
    CARTE_BANCAIRE: 'carte_bancaire',
    ESPECES: 'especes',
    PRELEVEMENT: 'prelevement',
    TRAITE: 'traite',
    AUTRE: 'autre'
};

export const TYPES_CLIENT = {
    PARTICULIER: 'particulier',
    PROFESSIONNEL: 'professionnel',
    ADMINISTRATION: 'administration'
};

export const TYPES_PRODUIT = {
    PRODUIT: 'produit',
    SERVICE: 'service'
};

export const SENS_COMPTABLE = {
    DEBIT: 'debit',
    CREDIT: 'credit'
};

export const REGIMES_TVA = {
    REEL_NORMAL: 'reel_normal',
    REEL_SIMPLIFIE: 'reel_simplifie',
    FRANCHISE_BASE: 'franchise_base'
};

export const METHODES_AMORTISSEMENT = {
    LINEAIRE: 'lineaire',
    DEGRESSIF: 'degressif'
};

// Messages d'erreur
export const ERROR_MESSAGES = {
    AUTH_FAILED: 'Échec de l\'authentification',
    UNAUTHORIZED: 'Accès non autorisé',
    NOT_FOUND: 'Ressource non trouvée',
    VALIDATION_ERROR: 'Erreur de validation',
    NETWORK_ERROR: 'Erreur réseau',
    UNKNOWN_ERROR: 'Erreur inconnue',
    PERIODE_CLOSED: 'Impossible de modifier une période clôturée',
    EXERCICE_CLOSED: 'Impossible de modifier un exercice clôturé'
};

// Formats
export const FORMATS = {
    DATE: 'DD/MM/YYYY',
    DATE_TIME: 'DD/MM/YYYY HH:mm',
    CURRENCY: '0,0.00',
    PERCENTAGE: '0.00',
    NUMERO_COMPTE: /^\d{6,}$/,
    SIRET: /^\d{14}$/,
    SIREN: /^\d{9}$/,
    TVA_INTRA: /^FR\d{11}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    IBAN: /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/
};

// Configuration locale
export const LOCALE = {
    COUNTRY: 'FR',
    CURRENCY: 'EUR',
    CURRENCY_SYMBOL: '€',
    DECIMAL_SEPARATOR: ',',
    THOUSANDS_SEPARATOR: ' ',
    DATE_LOCALE: 'fr-FR'
};

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
};

// Délais par défaut
export const DELAIS = {
    PAIEMENT_DEFAUT: 30, // jours
    VALIDITE_DEVIS: 30,  // jours
    SESSION_TIMEOUT: 3600 // secondes (1h)
};