// ============================================================================
// SERVICE COMPTABILITÉ
// Plan comptable, journaux, écritures, balance, grand livre
// ============================================================================

import { BaseService } from './base/BaseService.js';
import { TABLES, TYPES_ECRITURE, STATUTS_ECRITURE, SENS_COMPTABLE } from '../config/constants.js';
import { supabase } from '../config/supabase.js';
import { handleSupabaseError, logError } from '../utils/errorhandler.js';
import { roundCurrency } from '../utils/formatUtils.js';

/**
 * Service de comptabilité
 */
class ComptaService {
    constructor() {
        this.planComptableService = new BaseService(TABLES.PLAN_COMPTABLE, true);
        this.journauxService = new BaseService(TABLES.JOURNAUX, true);
        this.ecrituresService = new BaseService(TABLES.ECRITURES, true);
        this.lignesEcritureService = new BaseService(TABLES.LIGNES_ECRITURE, false);
    }

    // ========================================================================
    // GESTION ENTREPRISE
    // ========================================================================

    setEntreprise(entrepriseId) {
        this.planComptableService.setEntreprise(entrepriseId);
        this.journauxService.setEntreprise(entrepriseId);
        this.ecrituresService.setEntreprise(entrepriseId);
    }

    // ========================================================================
    // PLAN COMPTABLE
    // ========================================================================

    /**
     * Initialise le plan comptable avec les comptes de base
     * @returns {Promise<Array>}
     */
    async initializePlanComptable() {
        try {
            const comptesDeBase = [
                // Classe 1 - Capitaux
                { numero_compte: '101000', libelle: 'Capital social', classe: 1, type_compte: 'detail', sens_normal: 'credit', lettrable: false },
                { numero_compte: '120000', libelle: 'Résultat de l\'exercice', classe: 1, type_compte: 'detail', sens_normal: 'credit', lettrable: false },
                { numero_compte: '164000', libelle: 'Emprunts', classe: 1, type_compte: 'detail', sens_normal: 'credit', lettrable: false },
                
                // Classe 2 - Immobilisations
                { numero_compte: '218000', libelle: 'Matériel de bureau', classe: 2, type_compte: 'detail', sens_normal: 'debit', lettrable: false },
                { numero_compte: '281800', libelle: 'Amortissement matériel', classe: 2, type_compte: 'detail', sens_normal: 'credit', lettrable: false },
                
                // Classe 3 - Stocks
                { numero_compte: '370000', libelle: 'Stock de marchandises', classe: 3, type_compte: 'detail', sens_normal: 'debit', lettrable: false },
                
                // Classe 4 - Tiers
                { numero_compte: '401000', libelle: 'Fournisseurs', classe: 4, type_compte: 'detail', sens_normal: 'credit', lettrable: true },
                { numero_compte: '411000', libelle: 'Clients', classe: 4, type_compte: 'detail', sens_normal: 'debit', lettrable: true },
                { numero_compte: '445660', libelle: 'TVA déductible', classe: 4, type_compte: 'detail', sens_normal: 'debit', lettrable: false },
                { numero_compte: '445710', libelle: 'TVA collectée', classe: 4, type_compte: 'detail', sens_normal: 'credit', lettrable: false },
                { numero_compte: '445200', libelle: 'TVA à payer', classe: 4, type_compte: 'detail', sens_normal: 'credit', lettrable: false },
                
                // Classe 5 - Trésorerie
                { numero_compte: '512000', libelle: 'Banque', classe: 5, type_compte: 'detail', sens_normal: 'debit', lettrable: false },
                { numero_compte: '530000', libelle: 'Caisse', classe: 5, type_compte: 'detail', sens_normal: 'debit', lettrable: false },
                
                // Classe 6 - Charges
                { numero_compte: '607000', libelle: 'Achats de marchandises', classe: 6, type_compte: 'detail', sens_normal: 'debit', lettrable: false },
                { numero_compte: '681100', libelle: 'Dotations amortissements', classe: 6, type_compte: 'detail', sens_normal: 'debit', lettrable: false },
                
                // Classe 7 - Produits
                { numero_compte: '707000', libelle: 'Ventes de marchandises', classe: 7, type_compte: 'detail', sens_normal: 'credit', lettrable: false }
            ];

            const created = [];
            for (const compte of comptesDeBase) {
                const existing = await this.planComptableService.findOne({ numero_compte: compte.numero_compte });
                if (!existing) {
                    const result = await this.planComptableService.create(compte);
                    created.push(result);
                }
            }

            return created;
        } catch (error) {
            logError(error, 'comptaService.initializePlanComptable');
            throw error;
        }
    }

    /**
     * Récupère tous les comptes
     * @returns {Promise<Array>}
     */
    async getAllComptes() {
        return await this.planComptableService.getAll({
            orderBy: { column: 'numero_compte', ascending: true }
        });
    }

    /**
     * Recherche des comptes
     * @param {string} searchTerm - Terme de recherche
     * @returns {Promise<Array>}
     */
    async searchComptes(searchTerm) {
        return await this.planComptableService.search('libelle', searchTerm, {
            limit: 50
        });
    }

    /**
     * Récupère un compte par son numéro
     * @param {string} numeroCompte - Numéro de compte
     * @returns {Promise<Object|null>}
     */
    async getCompteByNumero(numeroCompte) {
        return await this.planComptableService.findOne({ numero_compte: numeroCompte });
    }

    // ========================================================================
    // JOURNAUX
    // ========================================================================

    /**
     * Initialise les journaux standards
     * @returns {Promise<Array>}
     */
    async initializeJournaux() {
        try {
            const journauxStandards = [
                { code: 'VT', libelle: 'Journal des ventes', type_journal: 'ventes', compte_contrepartie: '411000' },
                { code: 'AC', libelle: 'Journal des achats', type_journal: 'achats', compte_contrepartie: '401000' },
                { code: 'BQ', libelle: 'Journal de banque', type_journal: 'banque', compte_contrepartie: '512000' },
                { code: 'CA', libelle: 'Journal de caisse', type_journal: 'caisse', compte_contrepartie: '530000' },
                { code: 'OD', libelle: 'Opérations diverses', type_journal: 'operations_diverses', compte_contrepartie: null }
            ];

            const created = [];
            for (const journal of journauxStandards) {
                const existing = await this.journauxService.findOne({ code: journal.code });
                if (!existing) {
                    const result = await this.journauxService.create(journal);
                    created.push(result);
                }
            }

            return created;
        } catch (error) {
            logError(error, 'comptaService.initializeJournaux');
            throw error;
        }
    }

    /**
     * Récupère tous les journaux
     * @returns {Promise<Array>}
     */
    async getAllJournaux() {
        return await this.journauxService.getAll({
            orderBy: { column: 'code', ascending: true }
        });
    }

    // ========================================================================
    // ÉCRITURES COMPTABLES
    // ========================================================================

    /**
     * Crée une écriture comptable avec ses lignes
     * @param {Object} ecritureData - Données écriture
     * @param {Array} lignes - Lignes de l'écriture
     * @returns {Promise<Object>}
     */
    async createEcriture(ecritureData, lignes) {
        try {
            // Vérifier l'équilibre débit/crédit
            const totalDebit = lignes.reduce((sum, l) => sum + (l.debit || 0), 0);
            const totalCredit = lignes.reduce((sum, l) => sum + (l.credit || 0), 0);

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new Error(`Écriture non équilibrée: Débit ${totalDebit}€ ≠ Crédit ${totalCredit}€`);
            }

            // Créer l'écriture
            const ecriture = await this.ecrituresService.create({
                ...ecritureData,
                montant_total: roundCurrency(totalDebit)
            });

            // Créer les lignes
            const lignesWithNumero = lignes.map((ligne, index) => ({
                ...ligne,
                ecriture_id: ecriture.id,
                numero_ligne: index + 1
            }));

            const { data: createdLignes, error } = await supabase
                .from(TABLES.LIGNES_ECRITURE)
                .insert(lignesWithNumero)
                .select();

            if (error) throw error;

            return {
                ...ecriture,
                lignes: createdLignes
            };
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'comptaService.createEcriture');
            throw appError;
        }
    }

    /**
     * Récupère une écriture avec ses lignes
     * @param {string} id - ID écriture
     * @returns {Promise<Object|null>}
     */
    async getEcritureById(id) {
        try {
            const { data, error } = await supabase
                .from(TABLES.ECRITURES)
                .select(`
                    *,
                    journal:journaux(*),
                    lignes:lignes_ecriture(
                        *,
                        compte:plan_comptable(*)
                    )
                `)
                .eq('id', id)
                .eq('entreprise_id', this.ecrituresService.getEntreprise())
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return data || null;
        } catch (error) {
            logError(error, 'comptaService.getEcritureById');
            return null;
        }
    }

    /**
     * Valide une écriture (brouillard → validé)
     * @param {string} ecritureId - ID écriture
     * @param {string} userId - ID utilisateur validateur
     * @returns {Promise<Object>}
     */
    async validerEcriture(ecritureId, userId) {
        return await this.ecrituresService.update(ecritureId, {
            statut: STATUTS_ECRITURE.VALIDE,
            validee_par: userId,
            date_validation: new Date().toISOString()
        });
    }

    // ========================================================================
    // BALANCE
    // ========================================================================

    /**
     * Génère la balance des comptes
     * @param {string} exerciceId - ID exercice
     * @returns {Promise<Array>}
     */
    async getBalance(exerciceId) {
        try {
            const { data, error } = await supabase.rpc('get_balance', {
                p_entreprise_id: this.ecrituresService.getEntreprise(),
                p_exercice_id: exerciceId
            });

            if (error) {
                // Si la fonction RPC n'existe pas, on fait le calcul manuellement
                return await this.calculateBalanceManually(exerciceId);
            }

            return data;
        } catch (error) {
            logError(error, 'comptaService.getBalance');
            return await this.calculateBalanceManually(exerciceId);
        }
    }

    /**
     * Calcule la balance manuellement
     * @param {string} exerciceId - ID exercice
     * @returns {Promise<Array>}
     */
    async calculateBalanceManually(exerciceId) {
        try {
            // Récupérer toutes les écritures validées de l'exercice
            const { data: ecritures, error: ecrituresError } = await supabase
                .from(TABLES.ECRITURES)
                .select('id')
                .eq('entreprise_id', this.ecrituresService.getEntreprise())
                .eq('exercice_id', exerciceId)
                .eq('statut', STATUTS_ECRITURE.VALIDE);

            if (ecrituresError) throw ecrituresError;

            const ecritureIds = ecritures.map(e => e.id);

            if (ecritureIds.length === 0) return [];

            // Récupérer toutes les lignes avec comptes
            const { data: lignes, error: lignesError } = await supabase
                .from(TABLES.LIGNES_ECRITURE)
                .select(`
                    compte_id,
                    debit,
                    credit,
                    compte:plan_comptable(numero_compte, libelle)
                `)
                .in('ecriture_id', ecritureIds);

            if (lignesError) throw lignesError;

            // Grouper par compte
            const balance = {};

            lignes.forEach(ligne => {
                if (!balance[ligne.compte_id]) {
                    balance[ligne.compte_id] = {
                        numero_compte: ligne.compte.numero_compte,
                        libelle_compte: ligne.compte.libelle,
                        total_debit: 0,
                        total_credit: 0,
                        solde_debiteur: 0,
                        solde_crediteur: 0
                    };
                }

                balance[ligne.compte_id].total_debit += ligne.debit || 0;
                balance[ligne.compte_id].total_credit += ligne.credit || 0;
            });

            // Calculer les soldes
            return Object.values(balance).map(compte => {
                const diff = compte.total_debit - compte.total_credit;
                return {
                    ...compte,
                    solde_debiteur: diff > 0 ? roundCurrency(diff) : 0,
                    solde_crediteur: diff < 0 ? roundCurrency(-diff) : 0,
                    total_debit: roundCurrency(compte.total_debit),
                    total_credit: roundCurrency(compte.total_credit)
                };
            }).sort((a, b) => a.numero_compte.localeCompare(b.numero_compte));
        } catch (error) {
            logError(error, 'comptaService.calculateBalanceManually');
            return [];
        }
    }

    // ========================================================================
    // GRAND LIVRE
    // ========================================================================

    /**
     * Génère le grand livre d'un compte
     * @param {string} compteId - ID compte
     * @param {string} exerciceId - ID exercice
     * @returns {Promise<Array>}
     */
    async getGrandLivre(compteId, exerciceId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.LIGNES_ECRITURE)
                .select(`
                    *,
                    ecriture:ecritures(
                        date_ecriture,
                        numero_piece,
                        libelle,
                        journal:journaux(code, libelle)
                    )
                `)
                .eq('compte_id', compteId)
                .eq('ecriture.entreprise_id', this.ecrituresService.getEntreprise())
                .eq('ecriture.exercice_id', exerciceId)
                .eq('ecriture.statut', STATUTS_ECRITURE.VALIDE)
                .order('ecriture.date_ecriture', { ascending: true });

            if (error) throw error;

            // Calculer le solde progressif
            let solde = 0;
            return data.map(ligne => {
                solde += (ligne.debit || 0) - (ligne.credit || 0);
                return {
                    ...ligne,
                    solde_progressif: roundCurrency(solde)
                };
            });
        } catch (error) {
            logError(error, 'comptaService.getGrandLivre');
            return [];
        }
    }
}

// Export singleton
export const comptaService = new ComptaService();
export default comptaService;