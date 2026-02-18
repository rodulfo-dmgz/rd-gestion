/**
 * Configuration et utilitaires Supabase pour CRM Pédagogique
 * Module de connexion et gestion des requêtes
 * Version avec Singleton pour éviter les instances multiples
 */

// =====================================================
// CONFIGURATION SUPABASE
// =====================================================

const SUPABASE_CONFIG = {
    url: 'https://kowvfsesbuevylxayinl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtvd3Zmc2VzYnVldnlseGF5aW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTA5MTEsImV4cCI6MjA4NjQ4NjkxMX0.PNGHaHzmIz8FsDYKs3Pr0s_sASCalEAH4h6IXfle5do',
};

/**
 * Singleton pour gérer le client Supabase
 * Évite les instances multiples et les warnings
 */
const SupabaseClient = {
    instance: null,
    config: null,
    
    /**
     * Initialise le client Supabase (une seule fois)
     * @param {string} url - URL du projet Supabase
     * @param {string} anonKey - Clé anonyme du projet
     */
    init(url = SUPABASE_CONFIG.url, anonKey = SUPABASE_CONFIG.anonKey) {
        if (!window.supabase) {
            console.error('La bibliothèque Supabase JS n\'est pas chargée');
            return null;
        }
        
        // Ne créer qu'une seule instance
        if (!this.instance || this.config?.url !== url || this.config?.anonKey !== anonKey) {
            this.config = { url, anonKey };
            this.instance = window.supabase.createClient(url, anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: false,
                    storage: window.sessionStorage
                }
            });
            console.log('✅ Client Supabase initialisé');
        }
        
        return this.instance;
    },
    
    /**
     * Obtient l'instance du client (l'initialise si nécessaire)
     */
    get() {
        if (!this.instance) {
            return this.init();
        }
        return this.instance;
    },
    
    /**
     * Vérifie si le client est initialisé
     */
    isInitialized() {
        return this.instance !== null;
    }
};

/**
 * Initialise le client Supabase
 */
function initSupabase(url, anonKey) {
    return SupabaseClient.init(url, anonKey);
}

/**
 * Obtient le client Supabase
 */
function getSupabaseClient() {
    return SupabaseClient.get();
}

// =====================================================
// GESTION DE L'AUTHENTIFICATION
// =====================================================

/**
 * Connexion utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Résultat de la connexion
 */
async function signIn(email, password) {
    const client = getSupabaseClient();
    
    try {
        // Récupérer l'utilisateur depuis la table users personnalisée
        const { data: users, error: userError } = await client
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('actif', true)
            .single();
        
        if (userError || !users) {
            throw new Error('Utilisateur non trouvé ou inactif');
        }
        
        // Dans un contexte de formation, on simplifie la vérification
        // En production, utilisez bcrypt côté serveur
        
        // Stocker les informations utilisateur en session
        sessionStorage.setItem('currentUser', JSON.stringify(users));
        sessionStorage.setItem('userId', users.id);
        
        return { success: true, user: users };
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Déconnexion utilisateur
 */
function signOut() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('currentTenant');
    return { success: true };
}

/**
 * Obtient l'utilisateur connecté
 */
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Vérifie si l'utilisateur est connecté
 */
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// =====================================================
// GESTION DU TENANT ACTIF
// =====================================================

/**
 * Définit le tenant actif pour l'utilisateur
 * @param {string} tenantId - UUID du tenant
 */
function setCurrentTenant(tenantId) {
    sessionStorage.setItem('currentTenant', tenantId);
}

/**
 * Obtient le tenant actif
 */
function getCurrentTenant() {
    return sessionStorage.getItem('currentTenant');
}

/**
 * Récupère les tenants accessibles par l'utilisateur connecté
 */
async function getUserTenants() {
    const client = getSupabaseClient();
    const user = getCurrentUser();
    
    if (!user) {
        return { data: null, error: 'Utilisateur non connecté' };
    }
    
    try {
        const { data, error } = await client
            .from('user_tenants')
            .select(`
                tenant_id,
                tenants (
                    id,
                    code,
                    raison_sociale,
                    ville,
                    statut
                )
            `)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Extraire les tenants
        const tenants = data.map(ut => ut.tenants);
        return { data: tenants, error: null };
        
    } catch (error) {
        console.error('Erreur récupération tenants:', error);
        return { data: null, error: error.message };
    }
}

// =====================================================
// OPÉRATIONS CRUD GÉNÉRIQUES
// =====================================================

/**
 * Classe pour gérer les opérations CRUD sur une table
 */
class TableManager {
    constructor(tableName) {
        this.tableName = tableName;
        this.client = getSupabaseClient();
    }
    
    /**
     * Récupère tous les enregistrements (avec filtre tenant si applicable)
     * @param {Object} filters - Filtres supplémentaires
     * @param {string} select - Colonnes à sélectionner
     */
    async getAll(filters = {}, select = '*') {
        try {
            let query = this.client
                .from(this.tableName)
                .select(select);
            
            // Ajouter le filtre tenant automatiquement si applicable
            const tenantId = getCurrentTenant();
            if (tenantId && this.hastenantId()) {
                query = query.eq('tenant_id', tenantId);
            }
            
            // Ajouter les filtres supplémentaires
            Object.keys(filters).forEach(key => {
                query = query.eq(key, filters[key]);
            });
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { data, error: null };
            
        } catch (error) {
            console.error(`Erreur getAll ${this.tableName}:`, error);
            return { data: null, error: error.message };
        }
    }
    
    /**
     * Récupère un enregistrement par ID
     */
    async getById(id) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { data, error: null };
            
        } catch (error) {
            console.error(`Erreur getById ${this.tableName}:`, error);
            return { data: null, error: error.message };
        }
    }
    
    /**
     * Crée un nouvel enregistrement
     */
    async create(record) {
        try {
            // Ajouter automatiquement tenant_id si applicable
            const tenantId = getCurrentTenant();
            if (tenantId && this.hastenantId() && !record.tenant_id) {
                record.tenant_id = tenantId;
            }
            
            const { data, error } = await this.client
                .from(this.tableName)
                .insert([record])
                .select()
                .single();
            
            if (error) throw error;
            return { data, error: null };
            
        } catch (error) {
            console.error(`Erreur create ${this.tableName}:`, error);
            return { data: null, error: error.message };
        }
    }
    
    /**
     * Met à jour un enregistrement
     */
    async update(id, updates) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { data, error: null };
            
        } catch (error) {
            console.error(`Erreur update ${this.tableName}:`, error);
            return { data: null, error: error.message };
        }
    }
    
    /**
     * Supprime un enregistrement
     */
    async delete(id) {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true, error: null };
            
        } catch (error) {
            console.error(`Erreur delete ${this.tableName}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Vérifie si la table a une colonne tenant_id
     */
    hastenantId() {
        const tablesWithTenant = [
            'clients', 'fournisseurs', 'factures_vente', 'factures_achat',
            'produits_services', 'devis', 'commandes_vente', 'commandes_achat',
            'prospects', 'opportunites', 'contacts', 'reglements_clients',
            'reglements_fournisseurs', 'parametres_globaux', 'exercices_comptables',
            'plan_comptable', 'journaux', 'tva_taux', 'modes_reglement', 'banques',
            'categories_produits'
        ];
        return tablesWithTenant.includes(this.tableName);
    }
}

// =====================================================
// MANAGERS SPÉCIFIQUES PAR MODULE
// =====================================================

// Manager pour les clients
const clientsManager = new TableManager('clients');

// Manager pour les factures de vente
const facturesVenteManager = new TableManager('factures_vente');

// Manager pour les fournisseurs
const fournisseursManager = new TableManager('fournisseurs');

// Manager pour les produits/services
const produitsManager = new TableManager('produits_services');

// Manager pour les tenants
const tenantsManager = new TableManager('tenants');

// =====================================================
// FONCTIONS MÉTIER SPÉCIFIQUES
// =====================================================

/**
 * Récupère les factures avec leurs lignes
 */
async function getFacturesAvecLignes(filters = {}) {
    const client = getSupabaseClient();
    const tenantId = getCurrentTenant();
    
    try {
        let query = client
            .from('factures_vente')
            .select(`
                *,
                clients (
                    raison_sociale,
                    code_client
                ),
                lignes_factures_vente (
                    *,
                    produits_services (
                        libelle
                    )
                )
            `);
        
        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }
        
        Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
        });
        
        const { data, error } = await query;
        
        if (error) throw error;
        return { data, error: null };
        
    } catch (error) {
        console.error('Erreur getFacturesAvecLignes:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Récupère les statistiques du dashboard
 */
async function getDashboardStats() {
    const client = getSupabaseClient();
    const tenantId = getCurrentTenant();
    
    if (!tenantId) {
        return { data: null, error: 'Aucun tenant sélectionné' };
    }
    
    try {
        // Nombre de clients
        const { count: nbClients } = await client
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('actif', true);
        
        // Nombre de factures
        const { count: nbFactures } = await client
            .from('factures_vente')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);
        
        // CA total
        const { data: factures } = await client
            .from('factures_vente')
            .select('montant_ttc')
            .eq('tenant_id', tenantId)
            .in('statut', ['validée', 'envoyée', 'payée']);
        
        const caTotal = factures?.reduce((sum, f) => sum + (parseFloat(f.montant_ttc) || 0), 0) || 0;
        
        // Factures impayées
        const { count: nbImpayees } = await client
            .from('factures_vente')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('statut', 'impayée');
        
        return {
            data: {
                nbClients: nbClients || 0,
                nbFactures: nbFactures || 0,
                caTotal: caTotal,
                nbImpayees: nbImpayees || 0
            },
            error: null
        };
        
    } catch (error) {
        console.error('Erreur getDashboardStats:', error);
        return { data: null, error: error.message };
    }
}

// =====================================================
// UTILITAIRES
// =====================================================

/**
 * Formate un montant en euros
 */
function formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant);
}

/**
 * Formate une date
 */
function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
}

/**
 * Génère un nouveau code de facture
 */
async function genererCodeFacture() {
    const client = getSupabaseClient();
    const tenantId = getCurrentTenant();
    const annee = new Date().getFullYear();
    
    try {
        const { data } = await client
            .from('factures_vente')
            .select('code_facture')
            .eq('tenant_id', tenantId)
            .like('code_facture', `F${annee}-%`)
            .order('code_facture', { ascending: false })
            .limit(1);
        
        let numero = 1;
        if (data && data.length > 0) {
            const dernierCode = data[0].code_facture;
            const match = dernierCode.match(/F\d{4}-(\d+)/);
            if (match) {
                numero = parseInt(match[1]) + 1;
            }
        }
        
        return `F${annee}-${String(numero).padStart(3, '0')}`;
        
    } catch (error) {
        console.error('Erreur genererCodeFacture:', error);
        return `F${annee}-001`;
    }
}

// =====================================================
// INITIALISATION AUTOMATIQUE DU CLIENT
// =====================================================
initSupabase();

// =====================================================
// EXPOSITION GLOBALE (window.CRM)
// =====================================================
if (typeof window !== 'undefined') {
    window.CRM = {
        initSupabase,
        getSupabaseClient,
        signIn,
        signOut,
        getCurrentUser,
        isAuthenticated,
        setCurrentTenant,
        getCurrentTenant,
        getUserTenants,
        TableManager,
        clientsManager,
        facturesVenteManager,
        fournisseursManager,
        produitsManager,
        tenantsManager,
        getFacturesAvecLignes,
        getDashboardStats,
        formatMontant,
        formatDate,
        genererCodeFacture
    };
}