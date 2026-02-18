// ============================================================================
// UTILITAIRES DE DATES
// Gestion des dates, jours ouvrés, échéances
// ============================================================================

import { LOCALE } from '../config/constants.js';

// ============================================================================
// JOURS FÉRIÉS FRANÇAIS (année civile)
// ============================================================================

/**
 * Calcule les jours fériés pour une année donnée
 * @param {number} year - Année
 * @returns {Date[]} - Liste des jours fériés
 */
export function getJoursFeries(year) {
    const joursFeries = [];
    
    // Jours fixes
    joursFeries.push(new Date(year, 0, 1));   // Jour de l'an
    joursFeries.push(new Date(year, 4, 1));   // Fête du travail
    joursFeries.push(new Date(year, 4, 8));   // Victoire 1945
    joursFeries.push(new Date(year, 6, 14));  // Fête nationale
    joursFeries.push(new Date(year, 7, 15));  // Assomption
    joursFeries.push(new Date(year, 10, 1));  // Toussaint
    joursFeries.push(new Date(year, 10, 11)); // Armistice 1918
    joursFeries.push(new Date(year, 11, 25)); // Noël
    
    // Pâques et jours mobiles (calcul de Pâques)
    const paques = calculerPaques(year);
    joursFeries.push(new Date(paques.getTime() + 1 * 24 * 3600 * 1000));  // Lundi de Pâques
    joursFeries.push(new Date(paques.getTime() + 39 * 24 * 3600 * 1000)); // Ascension
    joursFeries.push(new Date(paques.getTime() + 50 * 24 * 3600 * 1000)); // Lundi de Pentecôte
    
    return joursFeries;
}

/**
 * Calcule la date de Pâques (algorithme de Meeus)
 * @param {number} year - Année
 * @returns {Date}
 */
function calculerPaques(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month - 1, day);
}

/**
 * Vérifie si une date est un jour férié
 * @param {Date} date - Date à vérifier
 * @returns {boolean}
 */
export function isJourFerie(date) {
    const joursFeries = getJoursFeries(date.getFullYear());
    return joursFeries.some(jf => 
        jf.getDate() === date.getDate() &&
        jf.getMonth() === date.getMonth() &&
        jf.getFullYear() === date.getFullYear()
    );
}

/**
 * Vérifie si une date est un week-end
 * @param {Date} date - Date à vérifier
 * @returns {boolean}
 */
export function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Dimanche ou Samedi
}

/**
 * Vérifie si une date est un jour ouvré
 * @param {Date} date - Date à vérifier
 * @returns {boolean}
 */
export function isJourOuvre(date) {
    return !isWeekend(date) && !isJourFerie(date);
}

// ============================================================================
// CALCULS DE DATES
// ============================================================================

/**
 * Ajoute des jours à une date
 * @param {Date} date - Date de départ
 * @param {number} days - Nombre de jours à ajouter
 * @returns {Date}
 */
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Ajoute des mois à une date
 * @param {Date} date - Date de départ
 * @param {number} months - Nombre de mois à ajouter
 * @returns {Date}
 */
export function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * Ajoute des années à une date
 * @param {Date} date - Date de départ
 * @param {number} years - Nombre d'années à ajouter
 * @returns {Date}
 */
export function addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
}

/**
 * Calcule la date d'échéance (ajoute N jours ouvrés)
 * @param {Date} dateDepart - Date de départ
 * @param {number} joursOuvres - Nombre de jours ouvrés
 * @returns {Date}
 */
export function calculerEcheance(dateDepart, joursOuvres) {
    let date = new Date(dateDepart);
    let joursAjoutes = 0;
    
    while (joursAjoutes < joursOuvres) {
        date = addDays(date, 1);
        if (isJourOuvre(date)) {
            joursAjoutes++;
        }
    }
    
    return date;
}

/**
 * Calcule la différence en jours entre deux dates
 * @param {Date} date1 - Première date
 * @param {Date} date2 - Deuxième date
 * @returns {number} - Nombre de jours (peut être négatif)
 */
export function diffInDays(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
}

/**
 * Calcule la différence en mois entre deux dates
 * @param {Date} date1 - Première date
 * @param {Date} date2 - Deuxième date
 * @returns {number}
 */
export function diffInMonths(date1, date2) {
    return (date2.getFullYear() - date1.getFullYear()) * 12 + 
           (date2.getMonth() - date1.getMonth());
}

// ============================================================================
// FORMATAGE
// ============================================================================

/**
 * Formate une date au format français (JJ/MM/AAAA)
 * @param {Date|string} date - Date à formater
 * @returns {string}
 */
export function formatDate(date) {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

/**
 * Formate une date au format ISO (AAAA-MM-JJ) pour la BDD
 * @param {Date|string} date - Date à formater
 * @returns {string}
 */
export function formatDateISO(date) {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return '';
    
    return d.toISOString().split('T')[0];
}

/**
 * Formate une date avec heure
 * @param {Date|string} date - Date à formater
 * @returns {string}
 */
export function formatDateTime(date) {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleString(LOCALE.DATE_LOCALE, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Parse une date française (JJ/MM/AAAA) vers un objet Date
 * @param {string} dateStr - Date au format français
 * @returns {Date|null}
 */
export function parseDate(dateStr) {
    if (!dateStr) return null;
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) return null;
    
    return date;
}

// ============================================================================
// DATES LIMITES / PÉRIODES
// ============================================================================

/**
 * Retourne le premier jour du mois
 * @param {Date} date - Date
 * @returns {Date}
 */
export function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Retourne le dernier jour du mois
 * @param {Date} date - Date
 * @returns {Date}
 */
export function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Retourne le premier jour de l'année
 * @param {number} year - Année
 * @returns {Date}
 */
export function getFirstDayOfYear(year) {
    return new Date(year, 0, 1);
}

/**
 * Retourne le dernier jour de l'année
 * @param {number} year - Année
 * @returns {Date}
 */
export function getLastDayOfYear(year) {
    return new Date(year, 11, 31);
}

/**
 * Vérifie si une date est dans une période
 * @param {Date} date - Date à vérifier
 * @param {Date} debut - Date de début
 * @param {Date} fin - Date de fin
 * @returns {boolean}
 */
export function isInPeriod(date, debut, fin) {
    return date >= debut && date <= fin;
}

/**
 * Retourne la date du jour à minuit
 * @returns {Date}
 */
export function getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/**
 * Vérifie si une date est dans le passé
 * @param {Date} date - Date à vérifier
 * @returns {boolean}
 */
export function isPast(date) {
    return date < getToday();
}

/**
 * Vérifie si une date est dans le futur
 * @param {Date} date - Date à vérifier
 * @returns {boolean}
 */
export function isFuture(date) {
    return date > getToday();
}

/**
 * Retourne le nom du mois
 * @param {number} month - Numéro du mois (0-11)
 * @returns {string}
 */
export function getMonthName(month) {
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return monthNames[month];
}

/**
 * Retourne une date relative (ex: "il y a 2 jours")
 * @param {Date|string} date - Date
 * @returns {string}
 */
export function getRelativeTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = Math.floor((now - d) / 1000); // en secondes
    
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
    
    return formatDate(d);
}