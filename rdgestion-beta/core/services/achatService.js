// ============================================================================
// SERVICE ACHATS
// Gestion factures fournisseurs → avoirs → paiements
// ============================================================================

import { DocumentService } from './base/DocumentService.js';
import { BaseService } from './base/BaseService.js';
import { TABLES, STATUTS_PAIEMENT, TYPES_PAIEMENT } from '../config/constants.js';
import { supabase } from '../config/supabase.js';
import { handleSupabaseError, logError } from '../utils/errorhandler.js';
import { calculateLigneComplete } from '../utils/tvaUtils.js';

/**
 * Service de gestion du cycle d'achat
 */
class AchatService {
    constructor() {
        this.facturesService = new DocumentService(TABLES.FACTURES_FOURNISSEURS, TABLES.LIGNES_FACTURE_FOURNISSEUR);
        this.avoirsService = new DocumentService(TABLES.AVOIRS_FOURNISSEURS, TABLES.LIGNES_AVOIR_FOURNISSEUR);
        this.paiementsService = new BaseService(TABLES.PAIEMENTS, true);
    }

    // ========================================================================
    // GESTION ENTREPRISE
    // ========================================================================

    setEntreprise(entrepriseId) {
        this.facturesService.setEntreprise(entrepriseId);
        this.avoirsService.setEntreprise(entrepriseId);
        this.paiementsService.setEntreprise(entrepriseId);
    }

    // ========================================================================
    // FACTURES FOURNISSEURS
    // ========================================================================

    /**
     * Crée une facture fournisseur
     * @param {Object} factureData - Données facture
     * @param {Array} lignes - Lignes
     * @returns {Promise<Object>}
     */
    async createFacture(factureData, lignes) {
        try {
            // Calculer les montants des lignes
            const lignesWithCalcul = lignes.map(ligne => {
                const montants = calculateLigneComplete(ligne);
                return { ...ligne, ...montants };
            });

            // Créer la facture
            const facture = await this.facturesService.createWithLignes(factureData, lignesWithCalcul);

            // Générer l'écriture comptable
            await this.genererEcritureFactureFournisseur(facture);

            return facture;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'achatService.createFacture');
            throw appError;
        }
    }

    /**
     * Récupère toutes les factures fournisseurs
     * @param {Object} options - Options
     * @returns {Promise<Array>}
     */
    async getAllFactures(options = {}) {
        return await this.facturesService.getAllWithLignes({
            ...options,
            orderBy: { column: 'date_facture', ascending: false }
        });
    }

    /**
     * Récupère une facture par ID
     * @param {string} id - ID facture
     * @returns {Promise<Object|null>}
     */
    async getFactureById(id) {
        return await this.facturesService.getWithLignes(id);
    }

    /**
     * Met à jour une facture
     * @param {string} id - ID facture
     * @param {Object} factureData - Données
     * @param {Array} lignes - Lignes
     * @returns {Promise<Object>}
     */
    async updateFacture(id, factureData, lignes) {
        try {
            const lignesWithCalcul = lignes.map(ligne => {
                const montants = calculateLigneComplete(ligne);
                return { ...ligne, ...montants };
            });

            return await this.facturesService.updateWithLignes(id, factureData, lignesWithCalcul);
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'achatService.updateFacture');
            throw appError;
        }
    }

    /**
     * Supprime une facture
     * @param {string} id - ID facture
     * @returns {Promise<boolean>}
     */
    async deleteFacture(id) {
        return await this.facturesService.deleteWithLignes(id);
    }

    /**
     * Récupère les factures impayées
     * @returns {Promise<Array>}
     */
    async getFacturesImpayees() {
        return await this.facturesService.findBy(
            { statut_paiement: STATUTS_PAIEMENT.NON_PAYE },
            { orderBy: { column: 'date_echeance', ascending: true } }
        );
    }

    /**
     * Récupère les factures en retard
     * @returns {Promise<Array>}
     */
    async getFacturesEnRetard() {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from(TABLES.FACTURES_FOURNISSEURS)
                .select('*')
                .eq('entreprise_id', this.facturesService.getEntreprise())
                .neq('statut_paiement', STATUTS_PAIEMENT.PAYE)
                .lt('date_echeance', today)
                .order('date_echeance', { ascending: true });

            if (error) throw error;

            return data;
        } catch (error) {
            logError(error, 'achatService.getFacturesEnRetard');
            return [];
        }
    }

    // ========================================================================
    // AVOIRS FOURNISSEURS
    // ========================================================================

    /**
     * Crée un avoir fournisseur
     * @param {Object} avoirData - Données avoir
     * @param {Array} lignes - Lignes
     * @returns {Promise<Object>}
     */
    async createAvoir(avoirData, lignes) {
        try {
            // Calculer les montants des lignes
            const lignesWithCalcul = lignes.map(ligne => {
                const montants = calculateLigneComplete(ligne);
                return { ...ligne, ...montants };
            });

            // Créer l'avoir
            const avoir = await this.avoirsService.createWithLignes(avoirData, lignesWithCalcul);

            // Générer l'écriture comptable
            await this.genererEcritureAvoirFournisseur(avoir);

            return avoir;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'achatService.createAvoir');
            throw appError;
        }
    }

    /**
     * Récupère tous les avoirs
     * @param {Object} options - Options
     * @returns {Promise<Array>}
     */
    async getAllAvoirs(options = {}) {
        return await this.avoirsService.getAllWithLignes({
            ...options,
            orderBy: { column: 'date_avoir', ascending: false }
        });
    }

    /**
     * Récupère un avoir par ID
     * @param {string} id - ID avoir
     * @returns {Promise<Object|null>}
     */
    async getAvoirById(id) {
        return await this.avoirsService.getWithLignes(id);
    }

    // ========================================================================
    // PAIEMENTS (RÈGLEMENTS)
    // ========================================================================

    /**
     * Enregistre un paiement fournisseur
     * @param {Object} paiementData - Données paiement
     * @returns {Promise<Object>}
     */
    async enregistrerPaiement(paiementData) {
        try {
            const paiement = await this.paiementsService.create({
                ...paiementData,
                type_paiement: TYPES_PAIEMENT.REGLEMENT,
                tiers_type: 'fournisseur'
            });

            // Mettre à jour le statut de la facture
            if (paiementData.document_lie_id && paiementData.document_lie_type === 'facture_fournisseur') {
                await this.updateFactureStatutPaiement(paiementData.document_lie_id);
            }

            // Générer l'écriture comptable
            await this.genererEcriturePaiement(paiement);

            return paiement;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'achatService.enregistrerPaiement');
            throw appError;
        }
    }

    /**
     * Met à jour le statut de paiement d'une facture
     * @param {string} factureId - ID facture
     * @returns {Promise<void>}
     */
    async updateFactureStatutPaiement(factureId) {
        try {
            // Récupérer la facture
            const facture = await this.getFactureById(factureId);

            if (!facture) return;

            // Calculer le total payé
            const { data: paiements, error } = await supabase
                .from(TABLES.PAIEMENTS)
                .select('montant')
                .eq('document_lie_id', factureId)
                .eq('document_lie_type', 'facture_fournisseur');

            if (error) throw error;

            const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);

            // Déterminer le statut
            let statut = STATUTS_PAIEMENT.NON_PAYE;
            if (totalPaye >= facture.montant_ttc) {
                statut = STATUTS_PAIEMENT.PAYE;
            } else if (totalPaye > 0) {
                statut = STATUTS_PAIEMENT.PARTIEL;
            }

            // Mettre à jour
            await this.facturesService.update(factureId, {
                montant_paye: totalPaye,
                statut_paiement: statut
            });
        } catch (error) {
            logError(error, 'achatService.updateFactureStatutPaiement');
        }
    }

    // ========================================================================
    // GÉNÉRATION ÉCRITURES COMPTABLES
    // ========================================================================

    async genererEcritureFactureFournisseur(facture) {
        // Implémenté dans comptaService
    }

    async genererEcritureAvoirFournisseur(avoir) {
        // Implémenté dans comptaService
    }

    async genererEcriturePaiement(paiement) {
        // Implémenté dans comptaService
    }

    // ========================================================================
    // STATISTIQUES
    // ========================================================================

    /**
     * Récupère les statistiques d'achat
     * @returns {Promise<Object>}
     */
    async getAchatsStats() {
        try {
            const totalFactures = await this.facturesService.count();
            const facturesPayees = await this.facturesService.count({ statut_paiement: STATUTS_PAIEMENT.PAYE });

            // Total achats
            const { data: facturesData, error } = await supabase
                .from(TABLES.FACTURES_FOURNISSEURS)
                .select('montant_ttc, statut_paiement')
                .eq('entreprise_id', this.facturesService.getEntreprise());

            if (error) throw error;

            const totalAchats = facturesData.reduce((sum, f) => sum + f.montant_ttc, 0);
            const totalPaye = facturesData
                .filter(f => f.statut_paiement === STATUTS_PAIEMENT.PAYE)
                .reduce((sum, f) => sum + f.montant_ttc, 0);

            return {
                factures: {
                    total: totalFactures,
                    payees: facturesPayees,
                    taux_paiement: totalFactures > 0 ? (facturesPayees / totalFactures * 100) : 0
                },
                montants: {
                    total: Math.round(totalAchats * 100) / 100,
                    paye: Math.round(totalPaye * 100) / 100,
                    a_payer: Math.round((totalAchats - totalPaye) * 100) / 100
                }
            };
        } catch (error) {
            logError(error, 'achatService.getAchatsStats');
            return {
                factures: { total: 0, payees: 0, taux_paiement: 0 },
                montants: { total: 0, paye: 0, a_payer: 0 }
            };
        }
    }
}

// Export singleton
export const achatService = new AchatService();
export default achatService;