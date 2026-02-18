/**
 * ═══════════════════════════════════════════════════════════════════════════
 * L'ÉCHOPPE GAULOISE - UTILITAIRES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Fonctions utilitaires réutilisables dans tout le projet
 * 
 * @author Rodulfo - Formateur & Développeur Web
 * @version 1.0.0
 */

const Utils = (() => {
  'use strict';

  /**
   * Debounce - Limite le nombre d'appels à une fonction
   * @param {Function} func - Fonction à debouncer
   * @param {number} wait - Délai en millisecondes
   * @returns {Function}
   */
  function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle - Assure qu'une fonction ne s'exécute qu'une fois par intervalle
   * @param {Function} func - Fonction à throttler
   * @param {number} limit - Intervalle minimum en millisecondes
   * @returns {Function}
   */
  function throttle(func, limit = 250) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Format price - Formate un prix selon la devise
   * @param {number} price - Prix à formater
   * @param {string} currency - Code devise (EUR, USD, GBP, etc.)
   * @returns {string}
   */
  function formatPrice(price, currency = 'EUR') {
    const currencySymbols = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      CAD: '$',
      CHF: 'CHF'
    };

    const symbol = currencySymbols[currency] || currency;
    const formattedPrice = price.toFixed(2).replace('.', ',');
    
    return currency === 'CHF' 
      ? `${formattedPrice} ${symbol}`
      : `${formattedPrice} ${symbol}`;
  }

  /**
   * Convert price - Convertit un prix vers une autre devise
   * @param {number} price - Prix en EUR
   * @param {string} targetCurrency - Devise cible
   * @returns {number}
   */
  function convertPrice(price, targetCurrency = 'EUR') {
    const exchangeRates = {
      EUR: 1,
      USD: 1.09,
      GBP: 0.86,
      CAD: 1.48,
      CHF: 0.95
    };

    return price * (exchangeRates[targetCurrency] || 1);
  }

  /**
   * Validate email - Valide une adresse email
   * @param {string} email - Email à valider
   * @returns {boolean}
   */
  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Generate unique ID - Génère un ID unique
   * @returns {string}
   */
  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get query parameter - Récupère un paramètre de l'URL
   * @param {string} param - Nom du paramètre
   * @returns {string|null}
   */
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  /**
   * Set cookie - Définit un cookie
   * @param {string} name - Nom du cookie
   * @param {string} value - Valeur du cookie
   * @param {number} days - Durée de vie en jours
   */
  function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  }

  /**
   * Get cookie - Récupère la valeur d'un cookie
   * @param {string} name - Nom du cookie
   * @returns {string|null}
   */
  function getCookie(name) {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
    return null;
  }

  /**
   * Local storage - Opérations sécurisées avec localStorage
   */
  const storage = {
    /**
     * Set item in localStorage
     * @param {string} key - Clé
     * @param {any} value - Valeur (sera stringify)
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
      }
    },

    /**
     * Get item from localStorage
     * @param {string} key - Clé
     * @returns {any|null}
     */
    get(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error('Error reading from localStorage:', e);
        return null;
      }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Clé
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error('Error removing from localStorage:', e);
        return false;
      }
    },

    /**
     * Clear all localStorage
     */
    clear() {
      try {
        localStorage.clear();
        return true;
      } catch (e) {
        console.error('Error clearing localStorage:', e);
        return false;
      }
    }
  };

  /**
   * Show notification - Affiche une notification temporaire
   * @param {string} message - Message à afficher
   * @param {string} type - Type (success, error, warning, info)
   * @param {number} duration - Durée d'affichage en ms
   */
  function showNotification(message, type = 'info', duration = 3000) {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Styles inline pour la notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '100px',
      right: '20px',
      padding: '16px 24px',
      backgroundColor: type === 'success' ? 'var(--color-success)' : 
                       type === 'error' ? 'var(--color-error)' :
                       type === 'warning' ? 'var(--color-warning)' : 
                       'var(--color-info)',
      color: 'white',
      borderRadius: 'var(--border-radius-md)',
      boxShadow: 'var(--shadow-xl)',
      zIndex: '9999',
      fontSize: 'var(--font-size-sm)',
      fontWeight: 'var(--font-weight-medium)',
      maxWidth: '350px',
      animation: 'slideInRight 0.3s ease-out',
      transition: 'opacity 0.3s ease-out'
    });

    // Ajouter au DOM
    document.body.appendChild(notification);

    // Retirer après la durée spécifiée
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  /**
   * Scroll to element - Scroll smooth vers un élément
   * @param {string|HTMLElement} target - Sélecteur ou élément
   * @param {number} offset - Offset en pixels
   */
  function scrollToElement(target, offset = 0) {
    const element = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;

    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Is in viewport - Vérifie si un élément est visible
   * @param {HTMLElement} element - Élément à vérifier
   * @returns {boolean}
   */
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Format date - Formate une date
   * @param {Date|string} date - Date à formater
   * @param {string} locale - Locale (fr-FR, en-US, etc.)
   * @returns {string}
   */
  function formatDate(date, locale = 'fr-FR') {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Sanitize HTML - Nettoie les balises HTML dangereuses
   * @param {string} html - HTML à nettoyer
   * @returns {string}
   */
  function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }

  /**
   * Shuffle array - Mélange un tableau (Fisher-Yates)
   * @param {Array} array - Tableau à mélanger
   * @returns {Array}
   */
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * Clamp - Limite une valeur entre min et max
   * @param {number} value - Valeur
   * @param {number} min - Minimum
   * @param {number} max - Maximum
   * @returns {number}
   */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Wait - Promise avec timeout
   * @param {number} ms - Millisecondes
   * @returns {Promise}
   */
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API publique
  return {
    debounce,
    throttle,
    formatPrice,
    convertPrice,
    validateEmail,
    generateId,
    getQueryParam,
    setCookie,
    getCookie,
    storage,
    showNotification,
    scrollToElement,
    isInViewport,
    formatDate,
    sanitizeHTML,
    shuffleArray,
    clamp,
    wait
  };
})();

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}