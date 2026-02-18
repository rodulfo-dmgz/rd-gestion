// ============================================================================
// SERVICE DOCUMENTS - Gestion parent + lignes
// Pour factures, devis, avoirs avec lignes de détail
// ============================================================================

import { BaseService } from './BaseService.js';
import { supabase } from '../../config/supabase.js';
import { handleSupabaseError, logError } from '../../utils/errorhandler.js';
import { calculateTotauxDocument } from '../../utils/tvaUtils.js';

/**
 * Classe pour gérer les documents avec lignes (factures, devis, etc.)
 */
export class DocumentService extends BaseService {
    /**
     * @param {string} tableName - Table du document parent
     * @param {string} lignesTableName - Table des lignes
     */
    constructor(tableName, lignesTableName) {
        super(tableName, true);
        this.lignesTableName = lignesTableName;
    }

    // ========================================================================
    // RÉCUPÉRATION AVEC LIGNES
    // ========================================================================

    /**
     * Récupère un document avec ses lignes
     * @param {string} id - UUID du document
     * @returns {Promise<Object>}
     */
    async getWithLignes(id) {
        try {
            let query = supabase
                .from(this.tableName)
                .select(`
                    *,
                    lignes:${this.lignesTableName}(*)
                `)
                .eq('id', id);
            
            query = this._addTenantFilter(query);
            
            const { data, error } = await query.single();
            
            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }
            
            return data;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.getWithLignes`);
            throw appError;
        }
    }

    /**
     * Récupère tous les documents avec leurs lignes
     * @param {Object} options - Options
     * @returns {Promise<Array>}
     */
    async getAllWithLignes(options = {}) {
        try {
            let query = supabase
                .from(this.tableName)
                .select(`
                    *,
                    lignes:${this.lignesTableName}(*)
                `);
            
            query = this._addTenantFilter(query);
            
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
            logError(appError, `${this.tableName}.getAllWithLignes`);
            throw appError;
        }
    }

    // ========================================================================
    // CRÉATION DOCUMENT + LIGNES
    // ========================================================================

    /**
     * Crée un document avec ses lignes (transaction atomique)
     * @param {Object} documentData - Données du document
     * @param {Array} lignes - Lignes du document
     * @returns {Promise<Object>}
     */
    async createWithLignes(documentData, lignes) {
        try {
            // 1. Calculer les totaux
            const totaux = calculateTotauxDocument(lignes);
            
            // 2. Créer le document parent
            const documentWithTotaux = this._addTenantToData({
                ...documentData,
                montant_ht: totaux.total_ht,
                montant_tva: totaux.total_tva,
                montant_ttc: totaux.total_ttc
            });
            
            const { data: document, error: docError } = await supabase
                .from(this.tableName)
                .insert(documentWithTotaux)
                .select()
                .single();
            
            if (docError) throw docError;
            
            // 3. Créer les lignes
            const lignesWithParent = lignes.map((ligne, index) => ({
                ...ligne,
                [`${this.getParentIdField()}`]: document.id,
                numero_ligne: index + 1
            }));
            
            const { data: createdLignes, error: lignesError } = await supabase
                .from(this.lignesTableName)
                .insert(lignesWithParent)
                .select();
            
            if (lignesError) {
                // Rollback : supprimer le document
                await supabase.from(this.tableName).delete().eq('id', document.id);
                throw lignesError;
            }
            
            return {
                ...document,
                lignes: createdLignes
            };
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.createWithLignes`);
            throw appError;
        }
    }

    // ========================================================================
    // MISE À JOUR DOCUMENT + LIGNES
    // ========================================================================

    /**
     * Met à jour un document et ses lignes
     * @param {string} id - UUID du document
     * @param {Object} documentData - Données du document
     * @param {Array} lignes - Nouvelles lignes
     * @returns {Promise<Object>}
     */
    async updateWithLignes(id, documentData, lignes) {
        try {
            // 1. Calculer les totaux
            const totaux = calculateTotauxDocument(lignes);
            
            // 2. Mettre à jour le document
            const documentWithTotaux = {
                ...documentData,
                montant_ht: totaux.total_ht,
                montant_tva: totaux.total_tva,
                montant_ttc: totaux.total_ttc
            };
            
            const updatedDoc = await this.update(id, documentWithTotaux);
            
            // 3. Supprimer les anciennes lignes
            const parentIdField = this.getParentIdField();
            await supabase
                .from(this.lignesTableName)
                .delete()
                .eq(parentIdField, id);
            
            // 4. Créer les nouvelles lignes
            const lignesWithParent = lignes.map((ligne, index) => ({
                ...ligne,
                [parentIdField]: id,
                numero_ligne: index + 1
            }));
            
            const { data: createdLignes, error: lignesError } = await supabase
                .from(this.lignesTableName)
                .insert(lignesWithParent)
                .select();
            
            if (lignesError) throw lignesError;
            
            return {
                ...updatedDoc,
                lignes: createdLignes
            };
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.updateWithLignes`);
            throw appError;
        }
    }

    // ========================================================================
    // SUPPRESSION
    // ========================================================================

    /**
     * Supprime un document et ses lignes (CASCADE géré par la BDD)
     * @param {string} id - UUID du document
     * @returns {Promise<boolean>}
     */
    async deleteWithLignes(id) {
        return await this.delete(id);
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    /**
     * Détermine le nom du champ ID parent dans la table lignes
     * @returns {string}
     */
    getParentIdField() {
        // Ex: factures_clients → facture_id, devis → devis_id
        const singular = this.tableName.replace(/s$/, '');
        return `${singular}_id`;
    }

    /**
     * Ajoute une ligne à un document existant
     * @param {string} documentId - UUID du document
     * @param {Object} ligneData - Données de la ligne
     * @returns {Promise<Object>}
     */
    async addLigne(documentId, ligneData) {
        try {
            // 1. Récupérer le document avec ses lignes
            const document = await this.getWithLignes(documentId);
            
            // 2. Ajouter la nouvelle ligne
            const nouvelleLignes = [
                ...document.lignes,
                ligneData
            ];
            
            // 3. Recalculer et mettre à jour
            const totaux = calculateTotauxDocument(nouvelleLignes);
            
            // 4. Créer la ligne
            const parentIdField = this.getParentIdField();
            const { data: ligne, error } = await supabase
                .from(this.lignesTableName)
                .insert({
                    ...ligneData,
                    [parentIdField]: documentId,
                    numero_ligne: document.lignes.length + 1
                })
                .select()
                .single();
            
            if (error) throw error;
            
            // 5. Mettre à jour les totaux du document
            await this.update(documentId, {
                montant_ht: totaux.total_ht,
                montant_tva: totaux.total_tva,
                montant_ttc: totaux.total_ttc
            });
            
            return ligne;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.addLigne`);
            throw appError;
        }
    }

    /**
     * Supprime une ligne d'un document
     * @param {string} documentId - UUID du document
     * @param {string} ligneId - UUID de la ligne
     * @returns {Promise<boolean>}
     */
    async deleteLigne(documentId, ligneId) {
        try {
            // 1. Supprimer la ligne
            const { error } = await supabase
                .from(this.lignesTableName)
                .delete()
                .eq('id', ligneId);
            
            if (error) throw error;
            
            // 2. Récupérer le document avec les lignes restantes
            const document = await this.getWithLignes(documentId);
            
            // 3. Recalculer les totaux
            const totaux = calculateTotauxDocument(document.lignes);
            
            // 4. Mettre à jour le document
            await this.update(documentId, {
                montant_ht: totaux.total_ht,
                montant_tva: totaux.total_tva,
                montant_ttc: totaux.total_ttc
            });
            
            return true;
        } catch (error) {
            const appError = handleSupabaseError(error);
            logError(appError, `${this.tableName}.deleteLigne`);
            throw appError;
        }
    }
}

export default DocumentService;