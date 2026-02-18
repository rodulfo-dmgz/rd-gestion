// ============================================================================
// SERVICE VENTES
// Gestion devis → factures clients → avoirs → paiements
// ============================================================================

import { DocumentService } from './base/DocumentService.js';
import { BaseService } from './base/BaseService.js';
import { TABLES, STATUTS_DEVIS, STATUTS_PAIEMENT, TYPES_PAIEMENT } from '../config/constants.js';
import { supabase } from '../config/supabase.js';
import { handleSupabaseError, logError } from '../utils/errorhandler.js';
import { calculateLigneComplete } from '../utils/tvaUtils.js';
import { addDays } from '../utils/dateUtils.js';

/**
 * Service de gestion du cycle de vente
 */
class VenteService {
    constructor() {
        this.devisService = new DocumentService(TABLES.DEVIS, TABLES.LIGNES_DEVIS);
        this.facturesService = new DocumentService(TABLES.FACTURES_CLIENTS, TABLES.LIGNES_FACTURE_CLIENT);
        this.avoirsService = new DocumentService(TABLES.AVOIRS_CLIENTS, TABLES.LIGNES_AVOIR_CLIENT);
        this.paiementsService = new BaseService(TABLES.PAIEMENTS, true);
    }

    // ========================================================================
    // GESTION ENTREPRISE
    // ========================================================================

    setEntreprise(entrepriseId) {
        this.devisService.setEntreprise(entrepriseId);
        this.facturesService.setEntreprise(entrepriseId);
        this.avoirsService.setEntreprise(entrepriseId);
        this.paiementsService.setEntreprise(entrepriseId);
    }

    // ========================================================================
    // DEVIS
    // ========================================================================

    /**
     * Crée un devis
     * @param {Object} devisData - Données devis
     * @param {Array} lignes - Lignes du devis
     * @returns {Promise<Object>}
     */
    async createDevis(devisData, lignes) {
        try {
            // Générer numéro de devis
            if (!devisData.numero_devis) {
                devisData.numero_devis = await this.generateNumeroDevis();
            }

            // Calculer les montants des lignes
            const lignesWithCalcul = lignes.map(ligne => {
                const montants = calculateLigneComplete(ligne);
                return { ...ligne, ...montants };
            });

            return await this.devisService.createWithLignes(devisData, lignesWithCalcul);
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'venteService.createDevis');
            throw appError;
        }
    }

    /**
     * Récupère tous les devis
     * @param {Object} options - Options
     * @returns {Promise<Array>}
     */
    async getAllDevis(options = {}) {
        return await this.devisService.getAllWithLignes({
            ...options,
            orderBy: { column: 'date_devis', ascending: false }
        });
    }

    /**
     * Récupère un devis par ID
     * @param {string} id - ID devis
     * @returns {Promise<Object|null>}
     */
    async getDevisById(id) {
        return await this.devisService.getWithLignes(id);
    }

    /**
     * Met à jour un devis
     * @param {string} id - ID devis
     * @param {Object} devisData - Données
     * @param {Array} lignes - Lignes
     * @returns {Promise<Object>}
     */
    async updateDevis(id, devisData, lignes) {
        try {
            const lignesWithCalcul = lignes.map(ligne => {
                const montants = calculateLigneComplete(ligne);
                return { ...ligne, ...montants };
            });

            return await this.devisService.updateWithLignes(id, devisData, lignesWithCalcul);
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'venteService.updateDevis');
            throw appError;
        }
    }

    /**
     * Supprime un devis
     * @param {string} id - ID devis
     * @returns {Promise<boolean>}
     */
    async deleteDevis(id) {
        return await this.devisService.deleteWithLignes(id);
    }

    /**
     * Transforme un devis en facture
     * @param {string} devisId - ID devis
     * @returns {Promise<Object>}
     */
    async transformerDevisEnFacture(devisId) {
        try {
            // 1. Récupérer le devis
            const devis = await this.getDevisById(devisId);

            if (!devis) {
                throw new Error('Devis non trouvé');
            }

            if (devis.statut !== STATUTS_DEVIS.ACCEPTE) {
                throw new Error('Le devis doit être accepté avant transformation');
            }

            // 2. Créer la facture
            const factureData = {
                client_id: devis.client_id,
                devis_id: devisId,
                date_facture: new Date().toISOString().split('T')[0],
                date_echeance: addDays(new Date(), 30).toISOString().split('T')[0],
                objet: devis.objet,
                notes: devis.notes,
                conditions_reglement: devis.conditions_reglement
            };

            const facture = await this.createFacture(factureData, devis.lignes);

            // 3. Mettre à jour le devis
            await this.devisService.update(devisId, {
                statut: STATUTS_DEVIS.TRANSFORME,
                facture_liee_id: facture.id
            });

            return facture;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'venteService.transformerDevisEnFacture');
            throw appError;
        }
    }

    /**
     * Génère un numéro de devis
     * @returns {Promise<string>}
     */
    async generateNumeroDevis() {
        try {
            const year = new Date().getFullYear();
            const count = await this.devisService.count();
            const numero = (count + 1).toString().padStart(4, '0');
            return `DEV-${year}-${numero}`;
        } catch (error) {
            return `DEV-${Date.now()}`;
        }
    }

    // ========================================================================
    // FACTURES CLIENTS
    // ========================================================================

    /**
     * Crée une facture client
     * @param {Object} factureData - Données facture
     * @param {Array} lignes - Lignes
     * @returns {Promise<Object>}
     */
    async createFacture(factureData, lignes) {
        try {
            // Générer numéro de facture
            if (!factureData.numero_facture) {
                factureData.numero_facture = await this.generateNumeroFacture();
            }

            // Calculer les montants des lignes
            const lignesWithCalcul = lignes.map(ligne => {
                const montants = calculateLigneComplete(ligne);
                return { ...ligne, ...montants };
            });

            // Créer la facture avec lignes
            const facture = await this.facturesService.createWithLignes(factureData, lignesWithCalcul);

            // Générer l'écriture comptable automatique
            await this.genererEcritureFactureClient(facture);

            return facture;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'venteService.createFacture');
            throw appError;
        }
    }

    /**
     * Récupère toutes les factures
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
            logError(appError, 'venteService.updateFacture');
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
     * Génère un numéro de facture
     * @returns {Promise<string>}
     */
    async generateNumeroFacture() {
        try {
            const year = new Date().getFullYear();
            const count = await this.facturesService.count();
            const numero = (count + 1).toString().padStart(4, '0');
            return `FA-${year}-${numero}`;
        } catch (error) {
            return `FA-${Date.now()}`;
        }
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
                .from(TABLES.FACTURES_CLIENTS)
                .select('*')
                .eq('entreprise_id', this.facturesService.getEntreprise())
                .neq('statut_paiement', STATUTS_PAIEMENT.PAYE)
                .lt('date_echeance', today)
                .order('date_echeance', { ascending: true });

            if (error) throw error;

            return data;
        } catch (error) {
            logError(error, 'venteService.getFacturesEnRetard');
            return [];
        }
    }

    // ========================================================================
    // AVOIRS CLIENTS
    // ========================================================================

    /**
     * Crée un avoir client
     * @param {Object} avoirData - Données avoir
     * @param {Array} lignes - Lignes
     * @returns {Promise<Object>}
     */
    async createAvoir(avoirData, lignes) {
        try {
            // Générer numéro d'avoir
            if (!avoirData.numero_avoir) {
                avoirData.numero_avoir = await this.generateNumeroAvoir();
            }

            // Calculer les montants des lignes
            const lignesWithCalcul = lignes.map(ligne => {
                const montants = calculateLigneComplete(ligne);
                return { ...ligne, ...montants };
            });

            // Créer l'avoir
            const avoir = await this.avoirsService.createWithLignes(avoirData, lignesWithCalcul);

            // Générer l'écriture comptable
            await this.genererEcritureAvoirClient(avoir);

            return avoir;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'venteService.createAvoir');
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

    /**
     * Génère un numéro d'avoir
     * @returns {Promise<string>}
     */
    async generateNumeroAvoir() {
        try {
            const year = new Date().getFullYear();
            const count = await this.avoirsService.count();
            const numero = (count + 1).toString().padStart(4, '0');
            return `AV-${year}-${numero}`;
        } catch (error) {
            return `AV-${Date.now()}`;
        }
    }

    // ========================================================================
    // PAIEMENTS (ENCAISSEMENTS)
    // ========================================================================

    /**
     * Enregistre un paiement client
     * @param {Object} paiementData - Données paiement
     * @returns {Promise<Object>}
     */
    async enregistrerPaiement(paiementData) {
        try {
            const paiement = await this.paiementsService.create({
                ...paiementData,
                type_paiement: TYPES_PAIEMENT.ENCAISSEMENT,
                tiers_type: 'client'
            });

            // Mettre à jour le statut de la facture
            if (paiementData.document_lie_id && paiementData.document_lie_type === 'facture_client') {
                await this.updateFactureStatutPaiement(paiementData.document_lie_id);
            }

            // Générer l'écriture comptable
            await this.genererEcriturePaiement(paiement);

            return paiement;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'venteService.enregistrerPaiement');
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
                .eq('document_lie_type', 'facture_client');

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
            logError(error, 'venteService.updateFactureStatutPaiement');
        }
    }

    // ========================================================================
    // GÉNÉRATION ÉCRITURES COMPTABLES
    // ========================================================================

    /**
     * Génère l'écriture comptable pour une facture client
     * @param {Object} facture - Facture
     * @returns {Promise<void>}
     */
    async genererEcritureFactureClient(facture) {
        // Cette méthode sera implémentée dans comptaService
        // Pour l'instant, on la laisse vide
        // Elle sera appelée via comptaService.genererEcritureFactureClient(facture)
    }

    /**
     * Génère l'écriture comptable pour un avoir client
     * @param {Object} avoir - Avoir
     * @returns {Promise<void>}
     */
    async genererEcritureAvoirClient(avoir) {
        // Idem, sera implémenté dans comptaService
    }

    /**
     * Génère l'écriture comptable pour un paiement
     * @param {Object} paiement - Paiement
     * @returns {Promise<void>}
     */
    async genererEcriturePaiement(paiement) {
        // Idem, sera implémenté dans comptaService
    }

    // ========================================================================
    // STATISTIQUES
    // ========================================================================

    /**
     * Récupère les statistiques de vente
     * @returns {Promise<Object>}
     */
    async getVentesStats() {
        try {
            const totalDevis = await this.devisService.count();
            const devisAcceptes = await this.devisService.count({ statut: STATUTS_DEVIS.ACCEPTE });
            const totalFactures = await this.facturesService.count();
            const facturesPayees = await this.facturesService.count({ statut_paiement: STATUTS_PAIEMENT.PAYE });

            // Chiffre d'affaires
            const { data: facturesData, error } = await supabase
                .from(TABLES.FACTURES_CLIENTS)
                .select('montant_ttc, statut_paiement')
                .eq('entreprise_id', this.facturesService.getEntreprise());

            if (error) throw error;

            const ca = facturesData.reduce((sum, f) => sum + f.montant_ttc, 0);
            const caEncaisse = facturesData
                .filter(f => f.statut_paiement === STATUTS_PAIEMENT.PAYE)
                .reduce((sum, f) => sum + f.montant_ttc, 0);

            return {
                devis: {
                    total: totalDevis,
                    acceptes: devisAcceptes,
                    taux_transformation: totalDevis > 0 ? (devisAcceptes / totalDevis * 100) : 0
                },
                factures: {
                    total: totalFactures,
                    payees: facturesPayees,
                    taux_paiement: totalFactures > 0 ? (facturesPayees / totalFactures * 100) : 0
                },
                chiffre_affaires: {
                    total: Math.round(ca * 100) / 100,
                    encaisse: Math.round(caEncaisse * 100) / 100,
                    en_attente: Math.round((ca - caEncaisse) * 100) / 100
                }
            };
        } catch (error) {
            logError(error, 'venteService.getVentesStats');
            return {
                devis: { total: 0, acceptes: 0, taux_transformation: 0 },
                factures: { total: 0, payees: 0, taux_paiement: 0 },
                chiffre_affaires: { total: 0, encaisse: 0, en_attente: 0 }
            };
        }
    }
}

// Export singleton
export const venteService = new VenteService();
export default venteService;