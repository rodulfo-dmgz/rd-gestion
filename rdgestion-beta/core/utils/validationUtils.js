// ============================================================================
// UTILITAIRES DE VALIDATION
// Validation SIRET, email, IBAN, etc.
// ============================================================================

import { FORMATS } from '../config/constants.js';

// ============================================================================
// VALIDATION IDENTIFIANTS FRANÇAIS
// ============================================================================

/**
 * Valide un numéro SIRET (14 chiffres)
 * @param {string} siret - SIRET à valider
 * @returns {boolean}
 */
export function isValidSIRET(siret) {
    if (!siret) return false;
    
    // Retirer les espaces
    const cleaned = siret.replace(/\s/g, '');
    
    // Vérifier que c'est 14 chiffres
    if (!/^\d{14}$/.test(cleaned)) return false;
    
    // Algorithme de Luhn
    let sum = 0;
    for (let i = 0; i < 14; i++) {
        let digit = parseInt(cleaned[i], 10);
        
        if (i % 2 === 0) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        
        sum += digit;
    }
    
    return sum % 10 === 0;
}

/**
 * Valide un numéro SIREN (9 chiffres)
 * @param {string} siren - SIREN à valider
 * @returns {boolean}
 */
export function isValidSIREN(siren) {
    if (!siren) return false;
    
    const cleaned = siren.replace(/\s/g, '');
    
    if (!/^\d{9}$/.test(cleaned)) return false;
    
    // Le SIREN est les 9 premiers chiffres du SIRET
    // On peut utiliser Luhn en ajoutant 5 zéros
    return isValidSIRET(cleaned + '00000');
}

/**
 * Valide un numéro de TVA intracommunautaire
 * @param {string} tva - Numéro TVA
 * @param {string} country - Code pays (défaut: FR)
 * @returns {boolean}
 */
export function isValidTVAIntra(tva, country = 'FR') {
    if (!tva) return false;
    
    const cleaned = tva.replace(/\s/g, '').toUpperCase();
    
    // Format français : FR + 2 chiffres clés + SIREN (9 chiffres)
    if (country === 'FR') {
        if (!/^FR[0-9A-Z]{2}\d{9}$/.test(cleaned)) return false;
        
        const siren = cleaned.slice(4);
        return isValidSIREN(siren);
    }
    
    // Format générique européen
    return /^[A-Z]{2}[0-9A-Z]{2,12}$/.test(cleaned);
}

// ============================================================================
// VALIDATION COORDONNÉES BANCAIRES
// ============================================================================

/**
 * Valide un IBAN
 * @param {string} iban - IBAN à valider
 * @returns {boolean}
 */
export function isValidIBAN(iban) {
    if (!iban) return false;
    
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    
    // Vérifier le format de base
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleaned)) return false;
    
    // Algorithme de validation IBAN (modulo 97)
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    
    const numericString = rearranged.replace(/[A-Z]/g, char => 
        (char.charCodeAt(0) - 55).toString()
    );
    
    return mod97(numericString) === 1;
}

/**
 * Calcule le modulo 97 pour grands nombres (validation IBAN)
 * @param {string} numStr - Nombre sous forme de chaîne
 * @returns {number}
 */
function mod97(numStr) {
    let remainder = 0;
    
    for (let i = 0; i < numStr.length; i++) {
        remainder = (remainder * 10 + parseInt(numStr[i], 10)) % 97;
    }
    
    return remainder;
}

/**
 * Valide un BIC/SWIFT
 * @param {string} bic - BIC à valider
 * @returns {boolean}
 */
export function isValidBIC(bic) {
    if (!bic) return false;
    
    const cleaned = bic.replace(/\s/g, '').toUpperCase();
    
    // Format : 4 lettres (banque) + 2 lettres (pays) + 2 lettres/chiffres (localisation) + 3 lettres/chiffres optionnels (branche)
    return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned);
}

// ============================================================================
// VALIDATION CONTACT
// ============================================================================

/**
 * Valide une adresse email
 * @param {string} email - Email à valider
 * @returns {boolean}
 */
export function isValidEmail(email) {
    if (!email) return false;
    
    return FORMATS.EMAIL.test(email.trim());
}

/**
 * Valide un numéro de téléphone français
 * @param {string} phone - Téléphone à valider
 * @returns {boolean}
 */
export function isValidPhone(phone) {
    if (!phone) return false;
    
    const cleaned = phone.replace(/[\s.\-]/g, '');
    
    // Format français : 10 chiffres commençant par 0
    return /^0[1-9]\d{8}$/.test(cleaned);
}

/**
 * Valide une URL
 * @param {string} url - URL à valider
 * @returns {boolean}
 */
export function isValidURL(url) {
    if (!url) return false;
    
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// VALIDATION COMPTABLE
// ============================================================================

/**
 * Valide un numéro de compte comptable
 * @param {string} compte - Numéro de compte
 * @returns {boolean}
 */
export function isValidNumeroCompte(compte) {
    if (!compte) return false;
    
    // Format : au moins 6 chiffres
    return FORMATS.NUMERO_COMPTE.test(compte);
}

/**
 * Valide une classe de compte (1-8)
 * @param {number} classe - Classe
 * @returns {boolean}
 */
export function isValidClasseCompte(classe) {
    return classe >= 1 && classe <= 8;
}

/**
 * Valide un code journal (2-10 caractères alphanumériques)
 * @param {string} code - Code journal
 * @returns {boolean}
 */
export function isValidCodeJournal(code) {
    if (!code) return false;
    
    return /^[A-Z0-9]{2,10}$/.test(code.toUpperCase());
}

// ============================================================================
// VALIDATION MONTANTS
// ============================================================================

/**
 * Valide qu'un montant est positif
 * @param {number} montant - Montant
 * @returns {boolean}
 */
export function isPositiveAmount(montant) {
    return typeof montant === 'number' && montant > 0;
}

/**
 * Valide qu'un montant est positif ou nul
 * @param {number} montant - Montant
 * @returns {boolean}
 */
export function isNonNegativeAmount(montant) {
    return typeof montant === 'number' && montant >= 0;
}

/**
 * Valide qu'un pourcentage est entre 0 et 100
 * @param {number} percentage - Pourcentage
 * @returns {boolean}
 */
export function isValidPercentage(percentage) {
    return typeof percentage === 'number' && percentage >= 0 && percentage <= 100;
}

/**
 * Valide un taux de TVA
 * @param {number} taux - Taux TVA
 * @returns {boolean}
 */
export function isValidTauxTVA(taux) {
    const tauxValides = [0, 2.1, 5.5, 10, 20];
    return tauxValides.includes(taux);
}

// ============================================================================
// VALIDATION DATES
// ============================================================================

/**
 * Valide qu'une date est dans le futur
 * @param {Date} date - Date à valider
 * @returns {boolean}
 */
export function isFutureDate(date) {
    if (!date) return false;
    return date > new Date();
}

/**
 * Valide qu'une date est dans le passé
 * @param {Date} date - Date à valider
 * @returns {boolean}
 */
export function isPastDate(date) {
    if (!date) return false;
    return date < new Date();
}

/**
 * Valide qu'une date de fin est après une date de début
 * @param {Date} dateDebut - Date de début
 * @param {Date} dateFin - Date de fin
 * @returns {boolean}
 */
export function isValidDateRange(dateDebut, dateFin) {
    if (!dateDebut || !dateFin) return false;
    return dateFin > dateDebut;
}

// ============================================================================
// VALIDATION FORMULAIRES
// ============================================================================

/**
 * Valide qu'un champ n'est pas vide
 * @param {*} value - Valeur
 * @returns {boolean}
 */
export function isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

/**
 * Valide une longueur minimale
 * @param {string} value - Valeur
 * @param {number} minLength - Longueur minimale
 * @returns {boolean}
 */
export function hasMinLength(value, minLength) {
    if (!value) return false;
    return value.length >= minLength;
}

/**
 * Valide une longueur maximale
 * @param {string} value - Valeur
 * @param {number} maxLength - Longueur maximale
 * @returns {boolean}
 */
export function hasMaxLength(value, maxLength) {
    if (!value) return true;
    return value.length <= maxLength;
}

/**
 * Valide qu'une valeur est dans une liste
 * @param {*} value - Valeur
 * @param {Array} allowedValues - Valeurs autorisées
 * @returns {boolean}
 */
export function isInList(value, allowedValues) {
    return allowedValues.includes(value);
}

// ============================================================================
// VALIDATION COMPLEXE
// ============================================================================

/**
 * Valide un objet selon un schéma
 * @param {Object} data - Données à valider
 * @param {Object} schema - Schéma de validation
 * @returns {Object} - {valid: boolean, errors: Array}
 */
export function validateSchema(data, schema) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        
        // Required
        if (rules.required && !isRequired(value)) {
            errors.push({
                field,
                message: `${field} est requis`
            });
            continue;
        }
        
        // Skip autres validations si non requis et vide
        if (!rules.required && !value) continue;
        
        // Type
        if (rules.type && typeof value !== rules.type) {
            errors.push({
                field,
                message: `${field} doit être de type ${rules.type}`
            });
        }
        
        // Min length
        if (rules.minLength && !hasMinLength(value, rules.minLength)) {
            errors.push({
                field,
                message: `${field} doit contenir au moins ${rules.minLength} caractères`
            });
        }
        
        // Max length
        if (rules.maxLength && !hasMaxLength(value, rules.maxLength)) {
            errors.push({
                field,
                message: `${field} ne doit pas dépasser ${rules.maxLength} caractères`
            });
        }
        
        // Email
        if (rules.email && !isValidEmail(value)) {
            errors.push({
                field,
                message: `${field} doit être un email valide`
            });
        }
        
        // Pattern
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push({
                field,
                message: rules.patternMessage || `${field} n'est pas valide`
            });
        }
        
        // Custom validator
        if (rules.validator && !rules.validator(value)) {
            errors.push({
                field,
                message: rules.validatorMessage || `${field} n'est pas valide`
            });
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Exemple de schéma de validation
 */
export const VALIDATION_SCHEMAS = {
    client: {
        code_client: {
            required: true,
            type: 'string',
            minLength: 3,
            maxLength: 20
        },
        raison_sociale: {
            required: true,
            type: 'string',
            minLength: 2,
            maxLength: 255
        },
        email: {
            required: false,
            email: true
        },
        siret: {
            required: false,
            validator: isValidSIRET,
            validatorMessage: 'SIRET invalide'
        }
    },
    
    produit: {
        reference: {
            required: true,
            type: 'string',
            minLength: 2,
            maxLength: 50
        },
        libelle: {
            required: true,
            type: 'string',
            minLength: 2,
            maxLength: 255
        },
        prix_vente_ht: {
            required: true,
            type: 'number',
            validator: isPositiveAmount,
            validatorMessage: 'Le prix doit être positif'
        }
    }
};