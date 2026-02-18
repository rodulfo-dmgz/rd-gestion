// ============================================================================
// UTILITAIRES TVA
// Calculs HT / TVA / TTC
// ============================================================================

import { roundCurrency } from './formatUtils.js';

// ============================================================================
// CALCULS DE BASE
// ============================================================================

/**
 * Calcule le montant TTC à partir de HT et taux TVA
 * @param {number} montantHT - Montant HT
 * @param {number} tauxTVA - Taux de TVA (ex: 20 pour 20%)
 * @returns {number}
 */
export function calculateTTC(montantHT, tauxTVA) {
    const montantTVA = calculateTVA(montantHT, tauxTVA);
    return roundCurrency(montantHT + montantTVA);
}

/**
 * Calcule le montant de TVA
 * @param {number} montantHT - Montant HT
 * @param {number} tauxTVA - Taux de TVA (ex: 20 pour 20%)
 * @returns {number}
 */
export function calculateTVA(montantHT, tauxTVA) {
    return roundCurrency(montantHT * (tauxTVA / 100));
}

/**
 * Calcule le montant HT à partir de TTC
 * @param {number} montantTTC - Montant TTC
 * @param {number} tauxTVA - Taux de TVA (ex: 20 pour 20%)
 * @returns {number}
 */
export function calculateHT(montantTTC, tauxTVA) {
    return roundCurrency(montantTTC / (1 + tauxTVA / 100));
}

/**
 * Calcule le montant de TVA à partir de TTC
 * @param {number} montantTTC - Montant TTC
 * @param {number} tauxTVA - Taux de TVA (ex: 20 pour 20%)
 * @returns {number}
 */
export function calculateTVAFromTTC(montantTTC, tauxTVA) {
    const montantHT = calculateHT(montantTTC, tauxTVA);
    return roundCurrency(montantTTC - montantHT);
}

// ============================================================================
// CALCULS LIGNES DE DOCUMENTS
// ============================================================================

/**
 * Calcule le montant d'une ligne HT (avec remise)
 * @param {number} quantite - Quantité
 * @param {number} prixUnitaireHT - Prix unitaire HT
 * @param {number} remisePourcent - Remise en % (optionnel)
 * @returns {number}
 */
export function calculateMontantLigneHT(quantite, prixUnitaireHT, remisePourcent = 0) {
    const montantBrut = quantite * prixUnitaireHT;
    const montantRemise = montantBrut * (remisePourcent / 100);
    return roundCurrency(montantBrut - montantRemise);
}

/**
 * Calcule les montants d'une ligne complète
 * @param {Object} ligne - {quantite, prix_unitaire_ht, remise_pourcent, taux_tva}
 * @returns {Object} - {montant_ht, montant_tva, montant_ttc}
 */
export function calculateLigneComplete(ligne) {
    const { quantite, prix_unitaire_ht, remise_pourcent = 0, taux_tva } = ligne;
    
    const montant_ht = calculateMontantLigneHT(quantite, prix_unitaire_ht, remise_pourcent);
    const montant_tva = calculateTVA(montant_ht, taux_tva);
    const montant_ttc = roundCurrency(montant_ht + montant_tva);
    
    return {
        montant_ht,
        montant_tva,
        montant_ttc
    };
}

// ============================================================================
// TOTAUX DOCUMENTS
// ============================================================================

/**
 * Calcule les totaux d'un document (facture, devis...)
 * @param {Array} lignes - Tableau de lignes
 * @returns {Object} - {total_ht, total_tva, total_ttc, details_tva}
 */
export function calculateTotauxDocument(lignes) {
    let total_ht = 0;
    let total_tva = 0;
    let total_ttc = 0;
    
    // Détails par taux de TVA
    const details_tva = {};
    
    lignes.forEach(ligne => {
        const montants = calculateLigneComplete(ligne);
        
        total_ht += montants.montant_ht;
        total_tva += montants.montant_tva;
        total_ttc += montants.montant_ttc;
        
        // Regrouper par taux de TVA
        const taux = ligne.taux_tva || 0;
        if (!details_tva[taux]) {
            details_tva[taux] = {
                taux: taux,
                base_ht: 0,
                montant_tva: 0
            };
        }
        
        details_tva[taux].base_ht += montants.montant_ht;
        details_tva[taux].montant_tva += montants.montant_tva;
    });
    
    // Arrondir les totaux
    return {
        total_ht: roundCurrency(total_ht),
        total_tva: roundCurrency(total_tva),
        total_ttc: roundCurrency(total_ttc),
        details_tva: Object.values(details_tva).map(d => ({
            taux: d.taux,
            base_ht: roundCurrency(d.base_ht),
            montant_tva: roundCurrency(d.montant_tva)
        }))
    };
}

// ============================================================================
// VÉRIFICATIONS
// ============================================================================

/**
 * Vérifie la cohérence d'un calcul TVA
 * @param {number} montantHT - Montant HT
 * @param {number} montantTVA - Montant TVA
 * @param {number} montantTTC - Montant TTC
 * @returns {boolean}
 */
export function verifyTVACalculation(montantHT, montantTVA, montantTTC) {
    const calculatedTTC = roundCurrency(montantHT + montantTVA);
    return Math.abs(calculatedTTC - montantTTC) < 0.01; // Tolérance de 1 centime
}

/**
 * Vérifie si un taux de TVA est valide en France
 * @param {number} taux - Taux de TVA
 * @returns {boolean}
 */
export function isValidTauxTVA(taux) {
    const tauxValides = [0, 2.1, 5.5, 10, 20]; // Taux en vigueur en France
    return tauxValides.includes(taux);
}

// ============================================================================
// DÉCLARATION DE TVA
// ============================================================================

/**
 * Calcule le montant de TVA à payer (TVA collectée - TVA déductible)
 * @param {number} tvaCollectee - TVA collectée (ventes)
 * @param {number} tvaDeductible - TVA déductible (achats)
 * @returns {number}
 */
export function calculateTVAAPayer(tvaCollectee, tvaDeductible) {
    return roundCurrency(tvaCollectee - tvaDeductible);
}

/**
 * Calcule la TVA sur encaissements (régime simplifié)
 * @param {Array} paiements - Liste des paiements {montant_ttc, taux_tva}
 * @returns {number}
 */
export function calculateTVASurEncaissements(paiements) {
    let totalTVA = 0;
    
    paiements.forEach(paiement => {
        const tva = calculateTVAFromTTC(paiement.montant_ttc, paiement.taux_tva);
        totalTVA += tva;
    });
    
    return roundCurrency(totalTVA);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retourne le libellé d'un taux de TVA
 * @param {number} taux - Taux de TVA
 * @returns {string}
 */
export function getTVALabel(taux) {
    switch (taux) {
        case 20: return 'TVA 20% (taux normal)';
        case 10: return 'TVA 10% (taux intermédiaire)';
        case 5.5: return 'TVA 5,5% (taux réduit)';
        case 2.1: return 'TVA 2,1% (taux super-réduit)';
        case 0: return 'TVA 0% (exonérée)';
        default: return `TVA ${taux}%`;
    }
}

/**
 * Calcule la répartition proportionnelle de TVA sur plusieurs lignes
 * @param {number} montantTotalTVA - Montant total de TVA
 * @param {Array} lignes - Lignes avec montant_ht
 * @returns {Array} - Lignes avec montant_tva réparti
 */
export function repartirTVAProportionnelle(montantTotalTVA, lignes) {
    const totalHT = lignes.reduce((sum, l) => sum + l.montant_ht, 0);
    
    let tvaRestante = montantTotalTVA;
    
    return lignes.map((ligne, index) => {
        // Pour la dernière ligne, on met le reste pour éviter les écarts d'arrondi
        if (index === lignes.length - 1) {
            return {
                ...ligne,
                montant_tva: roundCurrency(tvaRestante)
            };
        }
        
        const proportion = ligne.montant_ht / totalHT;
        const montant_tva = roundCurrency(montantTotalTVA * proportion);
        tvaRestante -= montant_tva;
        
        return {
            ...ligne,
            montant_tva
        };
    });
}