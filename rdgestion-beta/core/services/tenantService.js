// ============================================================================
// SERVICE TENANT (ENTREPRISES)
// Gestion multi-tenant, exercices, périodes
// ============================================================================

import { BaseService } from './base/BaseService.js';
import { supabase } from '../config/supabase.js';
import { TABLES } from '../config/constants.js';
import { handleSupabaseError, logError } from '../utils/errorhandler.js';
import { getFirstDayOfMonth, getLastDayOfMonth, getMonthName } from '../utils/dateUtils.js';

/**
 * Service de gestion des entreprises (tenants)
 */
class TenantService extends BaseService {
    constructor() {
        super(TABLES.ENTREPRISES, false); // Pas de tenant sur entreprises
        this.currentEntreprise = null;
    }

    // ========================================================================
    // GESTION ENTREPRISE COURANTE
    // ========================================================================

    /**
     * Définit l'entreprise active
     * @param {Object} entreprise - Entreprise
     */
    setCurrentEntreprise(entreprise) {
        this.currentEntreprise = entreprise;
        localStorage.setItem('current_entreprise', JSON.stringify(entreprise));
    }

    /**
     * Récupère l'entreprise active
     * @returns {Object|null}
     */
    getCurrentEntreprise() {
        if (!this.currentEntreprise) {
            const stored = localStorage.getItem('current_entreprise');
            if (stored) {
                this.currentEntreprise = JSON.parse(stored);
            }
        }
        return this.currentEntreprise;
    }

    /**
     * Efface l'entreprise courante
     */
    clearCurrentEntreprise() {
        this.currentEntreprise = null;
        localStorage.removeItem('current_entreprise');
    }

    // ========================================================================
    // CRUD ENTREPRISES
    // ========================================================================

    /**
     * Récupère les entreprises de l'utilisateur connecté
     * @param {string} userId - ID utilisateur
     * @returns {Promise<Array>}
     */
    async getUserEntreprises(userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.ENTREPRISES)
                .select('*')
                .eq('user_id', userId)
                .eq('actif', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.getUserEntreprises');
            throw appError;
        }
    }

    /**
     * Crée une nouvelle entreprise
     * @param {Object} entrepriseData - Données entreprise
     * @returns {Promise<Object>}
     */
    async createEntreprise(entrepriseData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.ENTREPRISES)
                .insert(entrepriseData)
                .select()
                .single();

            if (error) throw error;

            // Créer l'exercice par défaut
            await this.createDefaultExercice(data.id);

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.createEntreprise');
            throw appError;
        }
    }

    // ========================================================================
    // EXERCICES COMPTABLES
    // ========================================================================

    /**
     * Crée l'exercice par défaut pour une nouvelle entreprise
     * @param {string} entrepriseId - ID entreprise
     * @returns {Promise<Object>}
     */
    async createDefaultExercice(entrepriseId) {
        try {
            const currentYear = new Date().getFullYear();
            
            const exerciceData = {
                entreprise_id: entrepriseId,
                libelle: `Exercice ${currentYear}`,
                date_debut: `${currentYear}-01-01`,
                date_fin: `${currentYear}-12-31`,
                cloture: false
            };

            const { data: exercice, error: exError } = await supabase
                .from(TABLES.EXERCICES)
                .insert(exerciceData)
                .select()
                .single();

            if (exError) throw exError;

            // Créer les 12 périodes mensuelles
            await this.createPeriodesForExercice(exercice.id, currentYear);

            return exercice;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.createDefaultExercice');
            throw appError;
        }
    }

    /**
     * Crée les périodes mensuelles pour un exercice
     * @param {string} exerciceId - ID exercice
     * @param {number} year - Année
     * @returns {Promise<Array>}
     */
    async createPeriodesForExercice(exerciceId, year) {
        try {
            const periodes = [];

            for (let mois = 1; mois <= 12; mois++) {
                const dateDebut = getFirstDayOfMonth(new Date(year, mois - 1, 1));
                const dateFin = getLastDayOfMonth(new Date(year, mois - 1, 1));

                periodes.push({
                    exercice_id: exerciceId,
                    mois,
                    annee: year,
                    libelle: `${getMonthName(mois - 1)} ${year}`,
                    date_debut: dateDebut.toISOString().split('T')[0],
                    date_fin: dateFin.toISOString().split('T')[0],
                    cloturee: false
                });
            }

            const { data, error } = await supabase
                .from(TABLES.PERIODES)
                .insert(periodes)
                .select();

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.createPeriodesForExercice');
            throw appError;
        }
    }

    /**
     * Récupère les exercices d'une entreprise
     * @param {string} entrepriseId - ID entreprise
     * @returns {Promise<Array>}
     */
    async getExercices(entrepriseId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.EXERCICES)
                .select('*')
                .eq('entreprise_id', entrepriseId)
                .order('date_debut', { ascending: false });

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.getExercices');
            throw appError;
        }
    }

    /**
     * Récupère l'exercice en cours
     * @param {string} entrepriseId - ID entreprise
     * @returns {Promise<Object|null>}
     */
    async getCurrentExercice(entrepriseId) {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from(TABLES.EXERCICES)
                .select('*')
                .eq('entreprise_id', entrepriseId)
                .lte('date_debut', today)
                .gte('date_fin', today)
                .eq('cloture', false)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return data || null;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.getCurrentExercice');
            throw appError;
        }
    }

    /**
     * Clôture un exercice
     * @param {string} exerciceId - ID exercice
     * @param {string} userId - ID utilisateur qui clôture
     * @returns {Promise<Object>}
     */
    async clotureExercice(exerciceId, userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.EXERCICES)
                .update({
                    cloture: true,
                    date_cloture: new Date().toISOString(),
                    cloture_par: userId
                })
                .eq('id', exerciceId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.clotureExercice');
            throw appError;
        }
    }

    // ========================================================================
    // PÉRIODES
    // ========================================================================

    /**
     * Récupère les périodes d'un exercice
     * @param {string} exerciceId - ID exercice
     * @returns {Promise<Array>}
     */
    async getPeriodes(exerciceId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.PERIODES)
                .select('*')
                .eq('exercice_id', exerciceId)
                .order('mois', { ascending: true });

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.getPeriodes');
            throw appError;
        }
    }

    /**
     * Récupère la période en cours
     * @param {string} exerciceId - ID exercice
     * @returns {Promise<Object|null>}
     */
    async getCurrentPeriode(exerciceId) {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from(TABLES.PERIODES)
                .select('*')
                .eq('exercice_id', exerciceId)
                .lte('date_debut', today)
                .gte('date_fin', today)
                .eq('cloturee', false)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return data || null;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.getCurrentPeriode');
            throw appError;
        }
    }

    /**
     * Clôture une période
     * @param {string} periodeId - ID période
     * @param {string} userId - ID utilisateur
     * @returns {Promise<Object>}
     */
    async cloturePeriode(periodeId, userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.PERIODES)
                .update({
                    cloturee: true,
                    date_cloture: new Date().toISOString(),
                    cloturee_par: userId
                })
                .eq('id', periodeId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.cloturePeriode');
            throw appError;
        }
    }

    /**
     * Rouvre une période clôturée (Formateur uniquement)
     * @param {string} periodeId - ID période
     * @returns {Promise<Object>}
     */
    async rouvrirPeriode(periodeId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.PERIODES)
                .update({
                    cloturee: false,
                    date_cloture: null,
                    cloturee_par: null
                })
                .eq('id', periodeId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, 'tenantService.rouvrirPeriode');
            throw appError;
        }
    }
}

// Export singleton
export const tenantService = new TenantService();
export default tenantService;