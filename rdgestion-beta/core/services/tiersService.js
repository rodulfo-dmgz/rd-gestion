// ============================================================================
// SERVICE TIERS
// Gestion clients et fournisseurs
// ============================================================================

import { BaseService } from './base/BaseService.js';
import { TABLES } from '../config/constants.js';
import { supabase } from '../config/supabase.js';
import { handleSupabaseError, logError } from '../utils/errorhandler.js';

/**
 * Service de gestion des tiers (clients et fournisseurs)
 */
class TiersService {
    constructor() {
        this.clientsService = new BaseService(TABLES.CLIENTS, true);
        this.fournisseursService = new BaseService(TABLES.FOURNISSEURS, true);
    }

    // ========================================================================
    // GESTION ENTREPRISE
    // ========================================================================

    /**
     * Définit l'entreprise active pour les deux services
     * @param {string} entrepriseId - ID entreprise
     */
    setEntreprise(entrepriseId) {
        this.clientsService.setEntreprise(entrepriseId);
        this.fournisseursService.setEntreprise(entrepriseId);
    }

    // ========================================================================
    // CLIENTS
    // ========================================================================

    /**
     * Crée un nouveau client
     * @param {Object} clientData - Données client
     * @returns {Promise<Object>}
     */
    async createClient(clientData) {
        try {
            // Générer un code client automatique si non fourni
            if (!clientData.code_client) {
                clientData.code_client = await this.generateCodeClient();
            }

            return await this.clientsService.create(clientData);
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tiersService.createClient');
            throw appError;
        }
    }

    /**
     * Récupère tous les clients
     * @param {Object} options - Options de requête
     * @returns {Promise<Array>}
     */
    async getAllClients(options = {}) {
        return await this.clientsService.getAll({
            ...options,
            orderBy: { column: 'raison_sociale', ascending: true }
        });
    }

    /**
     * Récupère un client par ID
     * @param {string} id - ID client
     * @returns {Promise<Object|null>}
     */
    async getClientById(id) {
        return await this.clientsService.getById(id);
    }

    /**
     * Recherche des clients
     * @param {string} searchTerm - Terme de recherche
     * @returns {Promise<Array>}
     */
    async searchClients(searchTerm) {
        try {
            const { data, error } = await supabase
                .from(TABLES.CLIENTS)
                .select('*')
                .eq('entreprise_id', this.clientsService.getEntreprise())
                .or(`raison_sociale.ilike.%${searchTerm}%,code_client.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .order('raison_sociale', { ascending: true })
                .limit(20);

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tiersService.searchClients');
            throw appError;
        }
    }

    /**
     * Met à jour un client
     * @param {string} id - ID client
     * @param {Object} updates - Données à mettre à jour
     * @returns {Promise<Object>}
     */
    async updateClient(id, updates) {
        return await this.clientsService.update(id, updates);
    }

    /**
     * Supprime un client
     * @param {string} id - ID client
     * @returns {Promise<boolean>}
     */
    async deleteClient(id) {
        return await this.clientsService.delete(id);
    }

    /**
     * Génère un code client unique
     * @returns {Promise<string>}
     */
    async generateCodeClient() {
        try {
            const count = await this.clientsService.count();
            const numero = (count + 1).toString().padStart(4, '0');
            return `CLI${numero}`;
        } catch (error) {
            logError(error, 'tiersService.generateCodeClient');
            return `CLI${Date.now()}`;
        }
    }

    /**
     * Récupère les clients actifs uniquement
     * @returns {Promise<Array>}
     */
    async getActiveClients() {
        return await this.clientsService.findBy(
            { actif: true },
            { orderBy: { column: 'raison_sociale', ascending: true } }
        );
    }

    /**
     * Récupère le solde d'un client (factures non payées)
     * @param {string} clientId - ID client
     * @returns {Promise<number>}
     */
    async getClientBalance(clientId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.FACTURES_CLIENTS)
                .select('montant_ttc, montant_paye')
                .eq('entreprise_id', this.clientsService.getEntreprise())
                .eq('client_id', clientId)
                .neq('statut_paiement', 'paye');

            if (error) throw error;

            const solde = data.reduce((total, facture) => {
                return total + (facture.montant_ttc - (facture.montant_paye || 0));
            }, 0);

            return Math.round(solde * 100) / 100;
        } catch (error) {
            logError(error, 'tiersService.getClientBalance');
            return 0;
        }
    }

    // ========================================================================
    // FOURNISSEURS
    // ========================================================================

    /**
     * Crée un nouveau fournisseur
     * @param {Object} fournisseurData - Données fournisseur
     * @returns {Promise<Object>}
     */
    async createFournisseur(fournisseurData) {
        try {
            // Générer un code fournisseur automatique si non fourni
            if (!fournisseurData.code_fournisseur) {
                fournisseurData.code_fournisseur = await this.generateCodeFournisseur();
            }

            return await this.fournisseursService.create(fournisseurData);
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tiersService.createFournisseur');
            throw appError;
        }
    }

    /**
     * Récupère tous les fournisseurs
     * @param {Object} options - Options de requête
     * @returns {Promise<Array>}
     */
    async getAllFournisseurs(options = {}) {
        return await this.fournisseursService.getAll({
            ...options,
            orderBy: { column: 'raison_sociale', ascending: true }
        });
    }

    /**
     * Récupère un fournisseur par ID
     * @param {string} id - ID fournisseur
     * @returns {Promise<Object|null>}
     */
    async getFournisseurById(id) {
        return await this.fournisseursService.getById(id);
    }

    /**
     * Recherche des fournisseurs
     * @param {string} searchTerm - Terme de recherche
     * @returns {Promise<Array>}
     */
    async searchFournisseurs(searchTerm) {
        try {
            const { data, error } = await supabase
                .from(TABLES.FOURNISSEURS)
                .select('*')
                .eq('entreprise_id', this.fournisseursService.getEntreprise())
                .or(`raison_sociale.ilike.%${searchTerm}%,code_fournisseur.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .order('raison_sociale', { ascending: true })
                .limit(20);

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tiersService.searchFournisseurs');
            throw appError;
        }
    }

    /**
     * Met à jour un fournisseur
     * @param {string} id - ID fournisseur
     * @param {Object} updates - Données à mettre à jour
     * @returns {Promise<Object>}
     */
    async updateFournisseur(id, updates) {
        return await this.fournisseursService.update(id, updates);
    }

    /**
     * Supprime un fournisseur
     * @param {string} id - ID fournisseur
     * @returns {Promise<boolean>}
     */
    async deleteFournisseur(id) {
        return await this.fournisseursService.delete(id);
    }

    /**
     * Génère un code fournisseur unique
     * @returns {Promise<string>}
     */
    async generateCodeFournisseur() {
        try {
            const count = await this.fournisseursService.count();
            const numero = (count + 1).toString().padStart(4, '0');
            return `FOU${numero}`;
        } catch (error) {
            logError(error, 'tiersService.generateCodeFournisseur');
            return `FOU${Date.now()}`;
        }
    }

    /**
     * Récupère les fournisseurs actifs uniquement
     * @returns {Promise<Array>}
     */
    async getActiveFournisseurs() {
        return await this.fournisseursService.findBy(
            { actif: true },
            { orderBy: { column: 'raison_sociale', ascending: true } }
        );
    }

    /**
     * Récupère le solde d'un fournisseur (factures non payées)
     * @param {string} fournisseurId - ID fournisseur
     * @returns {Promise<number>}
     */
    async getFournisseurBalance(fournisseurId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.FACTURES_FOURNISSEURS)
                .select('montant_ttc, montant_paye')
                .eq('entreprise_id', this.fournisseursService.getEntreprise())
                .eq('fournisseur_id', fournisseurId)
                .neq('statut_paiement', 'paye');

            if (error) throw error;

            const solde = data.reduce((total, facture) => {
                return total + (facture.montant_ttc - (facture.montant_paye || 0));
            }, 0);

            return Math.round(solde * 100) / 100;
        } catch (error) {
            logError(error, 'tiersService.getFournisseurBalance');
            return 0;
        }
    }

    // ========================================================================
    // STATISTIQUES
    // ========================================================================

    /**
     * Récupère les statistiques clients
     * @returns {Promise<Object>}
     */
    async getClientsStats() {
        try {
            const total = await this.clientsService.count();
            const actifs = await this.clientsService.count({ actif: true });

            return {
                total,
                actifs,
                inactifs: total - actifs
            };
        } catch (error) {
            logError(error, 'tiersService.getClientsStats');
            return { total: 0, actifs: 0, inactifs: 0 };
        }
    }

    /**
     * Récupère les statistiques fournisseurs
     * @returns {Promise<Object>}
     */
    async getFournisseursStats() {
        try {
            const total = await this.fournisseursService.count();
            const actifs = await this.fournisseursService.count({ actif: true });

            return {
                total,
                actifs,
                inactifs: total - actifs
            };
        } catch (error) {
            logError(error, 'tiersService.getFournisseursStats');
            return { total: 0, actifs: 0, inactifs: 0 };
        }
    }
}

// Export singleton
export const tiersService = new TiersService();
export default tiersService;