// ============================================================================
// SERVICE DE BASE - CRUD GÉNÉRIQUE
// Gestion automatique du tenant_id et opérations CRUD standard
// ============================================================================

import { supabase } from '../../config/supabase.js';
import { handleSupabaseError, logError } from '../../utils/errorhandler.js';

/**
 * Classe de base pour tous les services
 * Fournit les opérations CRUD avec gestion automatique du tenant (entreprise_id)
 */
export class BaseService {
    /**
     * @param {string} tableName - Nom de la table Supabase
     * @param {boolean} hasTenant - Si true, gère automatiquement entreprise_id
     */
    constructor(tableName, hasTenant = true) {
        this.tableName = tableName;
        this.hasTenant = hasTenant;
        this.currentEntrepriseId = null;
    }

    // ========================================================================
    // GESTION DU TENANT (ENTREPRISE)
    // ========================================================================

    /**
     * Définit l'entreprise active pour ce service
     * @param {string} entrepriseId - UUID de l'entreprise
     */
    setEntreprise(entrepriseId) {
        this.currentEntrepriseId = entrepriseId;
    }

    /**
     * Récupère l'entreprise active
     * @returns {string|null}
     */
    getEntreprise() {
        return this.currentEntrepriseId;
    }

    /**
     * Ajoute automatiquement entreprise_id aux données si nécessaire
     * @param {Object} data - Données
     * @returns {Object}
     */
    _addTenantToData(data) {
        if (!this.hasTenant) return data;
        
        if (!this.currentEntrepriseId) {
            throw new Error('Aucune entreprise sélectionnée. Utilisez setEntreprise()');
        }
        
        return {
            ...data,
            entreprise_id: this.currentEntrepriseId
        };
    }

    /**
     * Ajoute le filtre entreprise_id à une requête
     * @param {SupabaseQueryBuilder} query - Requête Supabase
     * @returns {SupabaseQueryBuilder}
     */
    _addTenantFilter(query) {
        if (!this.hasTenant) return query;
        
        if (!this.currentEntrepriseId) {
            throw new Error('Aucune entreprise sélectionnée');
        }
        
        return query.eq('entreprise_id', this.currentEntrepriseId);
    }

    // ========================================================================
    // CRUD - CREATE
    // ========================================================================

    /**
     * Crée un nouvel enregistrement
     * @param {Object} data - Données à insérer
     * @param {Object} options - Options {select, returning}
     * @returns {Promise<Object>}
     */
    async create(data, options = {}) {
        try {
            const dataWithTenant = this._addTenantToData(data);
            
            let query = supabase
                .from(this.tableName)
                .insert(dataWithTenant);
            
            if (options.select) {
                query = query.select(options.select);
            } else {
                query = query.select();
            }
            
            const { data: result, error } = await query.single();
            
            if (error) throw error;
            
            return result;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.create`);
            throw appError;
        }
    }

    /**
     * Crée plusieurs enregistrements en une seule requête
     * @param {Array<Object>} dataArray - Tableau de données
     * @returns {Promise<Array>}
     */
    async createMany(dataArray) {
        try {
            const dataWithTenant = dataArray.map(data => this._addTenantToData(data));
            
            const { data: result, error } = await supabase
                .from(this.tableName)
                .insert(dataWithTenant)
                .select();
            
            if (error) throw error;
            
            return result;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.createMany`);
            throw appError;
        }
    }

    // ========================================================================
    // CRUD - READ
    // ========================================================================

    /**
     * Récupère un enregistrement par ID
     * @param {string} id - UUID
     * @param {string} select - Colonnes à sélectionner
     * @returns {Promise<Object|null>}
     */
    async getById(id, select = '*') {
        try {
            let query = supabase
                .from(this.tableName)
                .select(select)
                .eq('id', id);
            
            query = this._addTenantFilter(query);
            
            const { data, error } = await query.single();
            
            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }
            
            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.getById`);
            throw appError;
        }
    }

    /**
     * Récupère tous les enregistrements
     * @param {Object} options - {select, orderBy, limit, offset}
     * @returns {Promise<Array>}
     */
    async getAll(options = {}) {
        try {
            let query = supabase
                .from(this.tableName)
                .select(options.select || '*');
            
            query = this._addTenantFilter(query);
            
            if (options.orderBy) {
                const { column, ascending = true } = options.orderBy;
                query = query.order(column, { ascending });
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.getAll`);
            throw appError;
        }
    }

    /**
     * Recherche avec filtres personnalisés
     * @param {Object} filters - Filtres {column: value}
     * @param {Object} options - Options de requête
     * @returns {Promise<Array>}
     */
    async findBy(filters, options = {}) {
        try {
            let query = supabase
                .from(this.tableName)
                .select(options.select || '*');
            
            query = this._addTenantFilter(query);
            
            // Appliquer les filtres
            for (const [column, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    query = query.eq(column, value);
                }
            }
            
            if (options.orderBy) {
                const { column, ascending = true } = options.orderBy;
                query = query.order(column, { ascending });
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.findBy`);
            throw appError;
        }
    }

    /**
     * Recherche un seul enregistrement
     * @param {Object} filters - Filtres
     * @returns {Promise<Object|null>}
     */
    async findOne(filters) {
        const results = await this.findBy(filters, { limit: 1 });
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Compte le nombre d'enregistrements
     * @param {Object} filters - Filtres optionnels
     * @returns {Promise<number>}
     */
    async count(filters = {}) {
        try {
            let query = supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true });
            
            query = this._addTenantFilter(query);
            
            for (const [column, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    query = query.eq(column, value);
                }
            }
            
            const { count, error } = await query;
            
            if (error) throw error;
            
            return count || 0;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.count`);
            throw appError;
        }
    }

    // ========================================================================
    // CRUD - UPDATE
    // ========================================================================

    /**
     * Met à jour un enregistrement
     * @param {string} id - UUID
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        try {
            // Ne pas mettre à jour entreprise_id
            const { entreprise_id, ...dataToUpdate } = data;
            
            let query = supabase
                .from(this.tableName)
                .update(dataToUpdate)
                .eq('id', id);
            
            query = this._addTenantFilter(query);
            
            const { data: result, error } = await query.select().single();
            
            if (error) throw error;
            
            return result;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.update`);
            throw appError;
        }
    }

    /**
     * Met à jour plusieurs enregistrements
     * @param {Object} filters - Filtres pour identifier les enregistrements
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise<Array>}
     */
    async updateMany(filters, data) {
        try {
            const { entreprise_id, ...dataToUpdate } = data;
            
            let query = supabase
                .from(this.tableName)
                .update(dataToUpdate);
            
            query = this._addTenantFilter(query);
            
            for (const [column, value] of Object.entries(filters)) {
                query = query.eq(column, value);
            }
            
            const { data: result, error } = await query.select();
            
            if (error) throw error;
            
            return result;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.updateMany`);
            throw appError;
        }
    }

    // ========================================================================
    // CRUD - DELETE
    // ========================================================================

    /**
     * Supprime un enregistrement
     * @param {string} id - UUID
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        try {
            let query = supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);
            
            query = this._addTenantFilter(query);
            
            const { error } = await query;
            
            if (error) throw error;
            
            return true;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.delete`);
            throw appError;
        }
    }

    /**
     * Supprime plusieurs enregistrements
     * @param {Object} filters - Filtres
     * @returns {Promise<number>} - Nombre d'enregistrements supprimés
     */
    async deleteMany(filters) {
        try {
            let query = supabase
                .from(this.tableName)
                .delete();
            
            query = this._addTenantFilter(query);
            
            for (const [column, value] of Object.entries(filters)) {
                query = query.eq(column, value);
            }
            
            const { data, error } = await query.select();
            
            if (error) throw error;
            
            return data?.length || 0;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.deleteMany`);
            throw appError;
        }
    }

    // ========================================================================
    // HELPERS AVANCÉS
    // ========================================================================

    /**
     * Recherche avec LIKE (insensible à la casse)
     * @param {string} column - Colonne
     * @param {string} searchTerm - Terme de recherche
     * @param {Object} options - Options
     * @returns {Promise<Array>}
     */
    async search(column, searchTerm, options = {}) {
        try {
            let query = supabase
                .from(this.tableName)
                .select(options.select || '*');
            
            query = this._addTenantFilter(query);
            
            query = query.ilike(column, `%${searchTerm}%`);
            
            if (options.orderBy) {
                const { column, ascending = true } = options.orderBy;
                query = query.order(column, { ascending });
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.search`);
            throw appError;
        }
    }

    /**
     * Vérifie si un enregistrement existe
     * @param {Object} filters - Filtres
     * @returns {Promise<boolean>}
     */
    async exists(filters) {
        const count = await this.count(filters);
        return count > 0;
    }
}

export default BaseService;