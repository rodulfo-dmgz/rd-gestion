// ============================================================================
// UTILITAIRES DE FORMATAGE
// Formatage monétaire, pourcentages, nombres
// ============================================================================

import { LOCALE } from '../config/constants.js';

// ============================================================================
// FORMATAGE MONÉTAIRE
// ============================================================================

/**
 * Formate un montant en euros
 * @param {number} amount - Montant
 * @param {boolean} showSymbol - Afficher le symbole €
 * @returns {string}
 */
export function formatCurrency(amount, showSymbol = true) {
    if (amount === null || amount === undefined) return '-';
    
    const formatted = new Intl.NumberFormat(LOCALE.DATE_LOCALE, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
    
    return showSymbol ? `${formatted} ${LOCALE.CURRENCY_SYMBOL}` : formatted;
}

/**
 * Parse un montant formaté vers un nombre
 * @param {string} amountStr - Montant formaté (ex: "1 234,56 €")
 * @returns {number}
 */
export function parseCurrency(amountStr) {
    if (!amountStr) return 0;
    
    // Retirer le symbole € et les espaces
    let cleaned = amountStr.replace(/[€\s]/g, '');
    
    // Remplacer la virgule par un point
    cleaned = cleaned.replace(',', '.');
    
    return parseFloat(cleaned) || 0;
}

/**
 * Arrondit un montant à 2 décimales
 * @param {number} amount - Montant
 * @returns {number}
 */
export function roundCurrency(amount) {
    return Math.round(amount * 100) / 100;
}

// ============================================================================
// FORMATAGE POURCENTAGES
// ============================================================================

/**
 * Formate un pourcentage
 * @param {number} value - Valeur (ex: 20 pour 20%)
 * @param {number} decimals - Nombre de décimales
 * @returns {string}
 */
export function formatPercentage(value, decimals = 2) {
    if (value === null || value === undefined) return '-';
    
    return new Intl.NumberFormat(LOCALE.DATE_LOCALE, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value) + ' %';
}

/**
 * Parse un pourcentage formaté vers un nombre
 * @param {string} percentStr - Pourcentage formaté (ex: "20,5 %")
 * @returns {number}
 */
export function parsePercentage(percentStr) {
    if (!percentStr) return 0;
    
    const cleaned = percentStr.replace(/[%\s]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

// ============================================================================
// FORMATAGE NOMBRES
// ============================================================================

/**
 * Formate un nombre avec séparateurs de milliers
 * @param {number} value - Nombre
 * @param {number} decimals - Nombre de décimales
 * @returns {string}
 */
export function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined) return '-';
    
    return new Intl.NumberFormat(LOCALE.DATE_LOCALE, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Formate une quantité (avec unité optionnelle)
 * @param {number} value - Quantité
 * @param {string} unit - Unité (ex: "kg", "pièce")
 * @param {number} decimals - Nombre de décimales
 * @returns {string}
 */
export function formatQuantity(value, unit = '', decimals = 2) {
    if (value === null || value === undefined) return '-';
    
    const formatted = formatNumber(value, decimals);
    return unit ? `${formatted} ${unit}` : formatted;
}

// ============================================================================
// FORMATAGE IDENTIFIANTS
// ============================================================================

/**
 * Formate un SIRET (14 chiffres) : XXX XXX XXX XXXXX
 * @param {string} siret - SIRET
 * @returns {string}
 */
export function formatSIRET(siret) {
    if (!siret || siret.length !== 14) return siret;
    
    return `${siret.slice(0, 3)} ${siret.slice(3, 6)} ${siret.slice(6, 9)} ${siret.slice(9)}`;
}

/**
 * Formate un SIREN (9 chiffres) : XXX XXX XXX
 * @param {string} siren - SIREN
 * @returns {string}
 */
export function formatSIREN(siren) {
    if (!siren || siren.length !== 9) return siren;
    
    return `${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6)}`;
}

/**
 * Formate un numéro de TVA intracommunautaire
 * @param {string} tva - Numéro TVA (ex: FR12345678901)
 * @returns {string}
 */
export function formatTVAIntra(tva) {
    if (!tva) return tva;
    
    // FR XX XXX XXX XXX
    if (tva.length === 13) {
        return `${tva.slice(0, 2)} ${tva.slice(2, 4)} ${tva.slice(4, 7)} ${tva.slice(7, 10)} ${tva.slice(10)}`;
    }
    
    return tva;
}

/**
 * Formate un IBAN : FRXX XXXX XXXX XXXX XXXX XXXX XXX
 * @param {string} iban - IBAN
 * @returns {string}
 */
export function formatIBAN(iban) {
    if (!iban) return iban;
    
    // Retirer les espaces existants
    const cleaned = iban.replace(/\s/g, '');
    
    // Ajouter un espace tous les 4 caractères
    return cleaned.match(/.{1,4}/g)?.join(' ') || iban;
}

/**
 * Formate un numéro de téléphone français
 * @param {string} phone - Téléphone
 * @returns {string}
 */
export function formatPhone(phone) {
    if (!phone) return phone;
    
    // Retirer les espaces, points, tirets
    const cleaned = phone.replace(/[\s.\-]/g, '');
    
    // Format : XX XX XX XX XX
    if (cleaned.length === 10) {
        return cleaned.match(/.{1,2}/g)?.join(' ') || phone;
    }
    
    return phone;
}

// ============================================================================
// FORMATAGE NUMÉROS DE DOCUMENTS
// ============================================================================

/**
 * Formate un numéro de facture
 * @param {string} prefix - Préfixe (ex: "FA")
 * @param {number} year - Année
 * @param {number} number - Numéro séquentiel
 * @param {number} digits - Nombre de chiffres (padding)
 * @returns {string} - Ex: "FA-2024-001"
 */
export function formatDocumentNumber(prefix, year, number, digits = 3) {
    const paddedNumber = String(number).padStart(digits, '0');
    return `${prefix}-${year}-${paddedNumber}`;
}

/**
 * Parse un numéro de document
 * @param {string} docNumber - Ex: "FA-2024-001"
 * @returns {Object} - {prefix, year, number}
 */
export function parseDocumentNumber(docNumber) {
    const parts = docNumber.split('-');
    
    if (parts.length !== 3) return null;
    
    return {
        prefix: parts[0],
        year: parseInt(parts[1], 10),
        number: parseInt(parts[2], 10)
    };
}

// ============================================================================
// FORMATAGE TEXTE
// ============================================================================

/**
 * Capitalise la première lettre
 * @param {string} str - Texte
 * @returns {string}
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Tronque un texte avec ellipse
 * @param {string} str - Texte
 * @param {number} maxLength - Longueur max
 * @returns {string}
 */
export function truncate(str, maxLength) {
    if (!str || str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

/**
 * Enlève les accents d'une chaîne
 * @param {string} str - Texte
 * @returns {string}
 */
export function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Génère un slug (URL-friendly)
 * @param {string} str - Texte
 * @returns {string}
 */
export function slugify(str) {
    return removeAccents(str)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ============================================================================
// HELPERS DIVERS
// ============================================================================

/**
 * Formate une adresse complète
 * @param {Object} adresse - Objet adresse {adresse, code_postal, ville, pays}
 * @returns {string}
 */
export function formatAdresse(adresse) {
    const parts = [];
    
    if (adresse.adresse) parts.push(adresse.adresse);
    
    const ligne2 = [adresse.code_postal, adresse.ville]
        .filter(Boolean)
        .join(' ');
    
    if (ligne2) parts.push(ligne2);
    if (adresse.pays && adresse.pays !== 'France') parts.push(adresse.pays);
    
    return parts.join(', ');
}

/**
 * Formate un nom complet
 * @param {string} nom - Nom
 * @param {string} prenom - Prénom
 * @returns {string}
 */
export function formatNomComplet(nom, prenom) {
    const parts = [prenom, nom].filter(Boolean);
    return parts.join(' ');
}

/**
 * Vérifie si une valeur est vide (null, undefined, '', [], {})
 * @param {*} value - Valeur
 * @returns {boolean}
 */
export function isEmpty(value) {
    if (value === null || value === undefined || value === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
}