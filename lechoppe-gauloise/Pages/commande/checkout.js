/**
 * CHECKOUT PAGE — L'Échoppe Gauloise
 * Simulation de paiement pédagogique
 * 
 * Améliorations v2 :
 * - Architecture modulaire (GeoModule, ValidationModule, CheckoutApp)
 * - Chargement dynamique des pays via API restcountries.com
 * - Autocomplétion des villes par pays (CountriesToCities API + fallback)
 * - Event delegation pour la performance
 * - Debounce sur inputs temps réel
 * - Formatage Intl.NumberFormat
 * - DocumentFragment pour les rendus DOM par lot
 * 
 * Améliorations v3 :
 * - Utilisation de l'API GeoDB Cities (gratuite) pour pays, codes postaux et villes
 * - Clé API configurable
 * - Fallback robuste en cas d'échec API
 */

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════ */

const GEO_API_CONFIG = {
    API_KEY: '87e49e8a78msh8ef5dc74282fb43p12d964jsn6a14247db363', // Clé API GeoDB (gratuite)
    BASE_URL: 'https://wft-geo-db.p.rapidapi.com/v1/geo',
    HEADERS: {
        'X-RapidAPI-Key': '87e49e8a78msh8ef5dc74282fb43p12d964jsn6a14247db363',
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
    }
};

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITAIRES
   ═══════════════════════════════════════════════════════════════════════════ */

function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
});

function formatPrice(amount) {
    return currencyFormatter.format(amount);
}

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE GEO — Pays, Villes & Codes Postaux via API GeoDB
   ═══════════════════════════════════════════════════════════════════════════ */

const GeoModule = (() => {
    const cache = { 
        countries: null, 
        cities: new Map(),
        countryInfo: new Map()
    };

    // ─── Gestion du drapeau ─────────────────────────────────────
    function getFlagEmoji(code) {
        if (!code || code.length !== 2) return '🌍';
        return String.fromCodePoint(
            ...[...code.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65)
        );
    }

    // ─── API GeoDB ──────────────────────────────────────────────
    async function fetchGeoData(endpoint, params = {}) {
        const url = new URL(`${GEO_API_CONFIG.BASE_URL}/${endpoint}`);
        
        // Ajouter les paramètres
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });

        try {
            const res = await fetch(url, {
                headers: GEO_API_CONFIG.HEADERS
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status} - ${res.statusText}`);
            }

            return await res.json();
        } catch (err) {
            console.warn(`⚠️ API GeoDB indisponible (${endpoint}) :`, err.message);
            throw err;
        }
    }

    // ─── Chargement des pays ────────────────────────────────────
    async function loadCountries() {
        if (cache.countries) return cache.countries;

        try {
            // Essayer d'abord l'API GeoDB
            const data = await fetchGeoData('countries', {
                limit: 250,
                languageCode: 'fr'
            });

            const apiCountries = data.data.map(c => ({
                code: c.code,
                name: c.name,
                flag: getFlagEmoji(c.code),
                currencyCode: c.currencyCodes?.[0] || 'EUR',
                phoneCode: c.phoneCode || '+33'
            })).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

            cache.countries = apiCountries;
            console.log(`🌍 ${cache.countries.length} pays chargés (API GeoDB)`);
            
        } catch (err) {
            console.warn('⚠️ API GeoDB indisponible — fallback sur restcountries.com');
            
            // Fallback sur l'ancienne API
            try {
                const res = await fetch(
                    'https://restcountries.com/v3.1/all?fields=name,cca2,translations,flag,currencies,idd'
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                cache.countries = data
                    .map(c => ({
                        code: c.cca2,
                        name: c.translations?.fra?.common || c.name.common,
                        flag: c.flag || getFlagEmoji(c.cca2),
                        currencyCode: Object.keys(c.currencies || {})[0] || 'EUR',
                        phoneCode: c.idd?.root + (c.idd?.suffixes?.[0] || '') || '+33'
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

                console.log(`🌍 ${cache.countries.length} pays chargés (API restcountries fallback)`);
            } catch (fallbackErr) {
                console.warn('⚠️ Toutes les APIs indisponibles — fallback local');
                cache.countries = getFallbackCountries();
            }
        }

        return cache.countries;
    }

    function getFallbackCountries() {
        const raw = [
            'FR:France','BE:Belgique','CH:Suisse','LU:Luxembourg','DE:Allemagne',
            'ES:Espagne','IT:Italie','GB:Royaume-Uni','PT:Portugal','NL:Pays-Bas',
            'SE:Suède','NO:Norvège','DK:Danemark','FI:Finlande','IE:Irlande',
            'AT:Autriche','GR:Grèce','PL:Pologne','CZ:République Tchèque','HU:Hongrie',
            'SK:Slovaquie','SI:Slovénie','HR:Croatie','RO:Roumanie','BG:Bulgarie',
            'EE:Estonie','LV:Lettonie','LT:Lituanie','MT:Malte','CY:Chypre',
            'US:États-Unis','CA:Canada','AU:Australie','NZ:Nouvelle-Zélande',
            'JP:Japon','KR:Corée du Sud','CN:Chine','IN:Inde','BR:Brésil',
            'AR:Argentine','MX:Mexique','ZA:Afrique du Sud','MA:Maroc','TN:Tunisie',
            'DZ:Algérie','SN:Sénégal','CI:Côte d\'Ivoire','CM:Cameroun'
        ];
        return raw.map(s => {
            const [code, name] = s.split(':');
            return { 
                code, 
                name, 
                flag: getFlagEmoji(code),
                currencyCode: code === 'FR' ? 'EUR' : 'USD',
                phoneCode: '+33'
            };
        }).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }

    // ─── Recherche de villes avec codes postaux ─────────────────
    async function searchCities(countryCode, query) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase().trim();
        const cacheKey = `${countryCode}_${q.substring(0, 3)}`;

        // Vérifier le cache
        if (cache.cities.has(cacheKey)) {
            return cache.cities.get(cacheKey);
        }

        try {
            // Recherche via API GeoDB
            const data = await fetchGeoData('cities', {
                countryIds: countryCode,
                namePrefix: query,
                limit: 15,
                languageCode: 'fr',
                sort: '-population'
            });

            const cities = data.data.map(city => ({
                name: city.name,
                region: city.region,
                countryCode: city.countryCode,
                population: city.population,
                latitude: city.latitude,
                longitude: city.longitude,
                postalCodes: city.postalCodes || []
            }));

            // Formater pour l'affichage
            const formattedCities = cities.map(city => {
                let displayName = city.name;
                if (city.region) displayName += `, ${city.region}`;
                if (city.population > 100000) {
                    displayName += ` (${(city.population / 1000000).toFixed(1)}M hab.)`;
                }
                return {
                    display: displayName,
                    value: city.name,
                    postalCodes: city.postalCodes,
                    region: city.region
                };
            });

            // Mettre en cache
            cache.cities.set(cacheKey, formattedCities);
            return formattedCities;

        } catch (err) {
            console.warn(`⚠️ API villes indisponible pour ${countryCode}`, err.message);
            return getFallbackCities(countryCode, q);
        }
    }

    // ─── Récupérer les codes postaux pour une ville ─────────────
    async function getPostalCodesForCity(countryCode, cityName) {
        try {
            const data = await fetchGeoData('cities', {
                countryIds: countryCode,
                namePrefix: cityName,
                limit: 5,
                languageCode: 'fr'
            });

            // Trouver la ville exacte
            const city = data.data.find(c => 
                c.name.toLowerCase() === cityName.toLowerCase() ||
                c.city?.toLowerCase() === cityName.toLowerCase()
            );

            if (city && city.postalCodes && city.postalCodes.length > 0) {
                return city.postalCodes;
            }

            // Si pas de codes postaux spécifiques, retourner des codes génériques
            return generateGenericPostalCodes(countryCode);

        } catch (err) {
            console.warn(`⚠️ Impossible de récupérer les codes postaux pour ${cityName}`, err.message);
            return generateGenericPostalCodes(countryCode);
        }
    }

    // ─── Générer des codes postaux génériques ───────────────────
    function generateGenericPostalCodes(countryCode) {
        const patterns = {
            'FR': () => Array.from({length: 10}, (_, i) => `${75000 + i}`),
            'BE': () => Array.from({length: 10}, (_, i) => `${1000 + i}`),
            'CH': () => Array.from({length: 10}, (_, i) => `${1200 + i}`),
            'LU': () => Array.from({length: 5}, (_, i) => `${1000 + i}`),
            'DE': () => Array.from({length: 10}, (_, i) => `${10000 + i}`),
            'ES': () => Array.from({length: 10}, (_, i) => `${28000 + i}`),
            'IT': () => Array.from({length: 10}, (_, i) => `${'00100' + i}`),
            'GB': () => Array.from({length: 10}, (_, i) => `SW${i+1}A`),
            'US': () => Array.from({length: 10}, (_, i) => `${10000 + i}`),
            'CA': () => Array.from({length: 10}, (_, i) => `M${i+1}A`),
        };

        const generator = patterns[countryCode] || (() => []);
        return generator();
    }

    // ─── Fallback pour les villes ───────────────────────────────
    function getFallbackCities(code, query = '') {
        const fallbacks = {
            FR: ['Paris','Marseille','Lyon','Toulouse','Nice','Nantes','Montpellier',
                 'Strasbourg','Bordeaux','Lille','Rennes','Reims','Toulon','Le Havre',
                 'Saint-Étienne','Grenoble','Dijon','Angers','Nîmes','Villeurbanne',
                 'Clermont-Ferrand','Le Mans','Aix-en-Provence','Brest','Tours',
                 'Amiens','Limoges','Perpignan','Metz','Besançon','Orléans',
                 'Rouen','Mulhouse','Caen','Nancy','Argenteuil','Montreuil',
                 'Saint-Denis','Avignon','Versailles','Pau','La Rochelle','Calais',
                 'Cannes','Antibes','Béziers','Ajaccio','Bastia','Dunkerque',
                 'Valence','Colmar','Quimper','Lorient','Bayonne','Chambéry',
                 'Poitiers','Troyes','Bourges','La Roche-sur-Yon','Niort',
                 'Épinal','Charleville-Mézières','Brive-la-Gaillarde','Tarbes',
                 'Albi','Montauban','Cahors','Rodez','Auch','Foix'],
            BE: ['Bruxelles','Anvers','Gand','Charleroi','Liège','Namur','Bruges',
                 'Mons','Louvain','Tournai','Courtrai','Verviers','Mouscron','Arlon',
                 'Wavre','Ottignies','Nivelles','Seraing','La Louvière','Hasselt'],
            CH: ['Zurich','Genève','Bâle','Lausanne','Berne','Lucerne','Saint-Gall',
                 'Lugano','Bienne','Thoune','Fribourg','La Chaux-de-Fonds','Sion',
                 'Neuchâtel','Montreux','Yverdon','Nyon','Delémont','Martigny'],
            // ... (garder les autres pays du fallback original)
        };

        const cities = fallbacks[code] || [];
        if (!query) return cities.map(city => ({ display: city, value: city, postalCodes: [] }));

        const q = query.toLowerCase();
        return cities
            .filter(city => city.toLowerCase().includes(q))
            .map(city => ({ display: city, value: city, postalCodes: [] }))
            .slice(0, 15);
    }

    // ─── Charger les informations d'un pays ─────────────────────
    async function loadCountryInfo(countryCode) {
        if (cache.countryInfo.has(countryCode)) {
            return cache.countryInfo.get(countryCode);
        }

        try {
            const data = await fetchGeoData(`countries/${countryCode}`, {
                languageCode: 'fr'
            });

            const info = {
                capital: data.data.capital,
                currencyCode: data.data.currencyCodes?.[0],
                phoneCode: data.data.phoneCode,
                flagEmoji: getFlagEmoji(countryCode),
                postalCodeFormat: getPostalCodeFormat(countryCode)
            };

            cache.countryInfo.set(countryCode, info);
            return info;

        } catch (err) {
            console.warn(`⚠️ Impossible de charger les infos du pays ${countryCode}`, err.message);
            const defaultInfo = {
                capital: '',
                currencyCode: 'EUR',
                phoneCode: '+33',
                flagEmoji: getFlagEmoji(countryCode),
                postalCodeFormat: getPostalCodeFormat(countryCode)
            };
            cache.countryInfo.set(countryCode, defaultInfo);
            return defaultInfo;
        }
    }

    // ─── Format des codes postaux par pays ──────────────────────
    function getPostalCodeFormat(countryCode) {
        const formats = {
            'FR': '5 chiffres (ex: 75001)',
            'BE': '4 chiffres (ex: 1000)',
            'CH': '4 chiffres (ex: 1200)',
            'LU': '4 chiffres (ex: 1234)',
            'DE': '5 chiffres (ex: 10115)',
            'ES': '5 chiffres (ex: 28001)',
            'IT': '5 chiffres (ex: 00100)',
            'GB': '6-7 caractères (ex: SW1A 1AA)',
            'US': '5 chiffres (ex: 90210)',
            'CA': '6 caractères (ex: M5V 2T6)',
            'NL': '4 chiffres + 2 lettres (ex: 1234 AB)',
            'PT': '4 chiffres + tiret + 3 chiffres (ex: 4000-001)',
            'AU': '4 chiffres (ex: 2000)',
            'NZ': '4 chiffres (ex: 6011)',
            'JP': '3 chiffres + tiret + 4 chiffres (ex: 100-0001)',
            'KR': '5 chiffres (ex: 03051)',
            'IN': '6 chiffres (ex: 110001)',
            'BR': '5 chiffres + tiret + 3 chiffres (ex: 12345-678)',
            'AR': '4 chiffres + tiret + 3 chiffres (ex: C1234ABC)',
            'MX': '5 chiffres (ex: 01000)',
            'ZA': '4 chiffres (ex: 0001)',
            'MA': '5 chiffres (ex: 10000)',
            'TN': '4 chiffres (ex: 1000)',
            'DZ': '5 chiffres (ex: 16000)',
            'SN': '5 chiffres (ex: 12500)',
            'CI': '5 chiffres (ex: 01 BP 1)'
        };
        return formats[countryCode] || 'Code postal';
    }

    // ─── API publique ────────────────────────────────────────────
    return { 
        loadCountries, 
        searchCities, 
        getPostalCodesForCity,
        loadCountryInfo,
        getFlagEmoji,
        getPostalCodeFormat 
    };
})();

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE VALIDATION
   ═══════════════════════════════════════════════════════════════════════════ */

const ValidationModule = (() => {
    const rules = {
        email: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Veuillez entrer un email valide',
        },
        phone: {
            validate(val) {
                const clean = val.replace(/[\s\-\+\.\(\)]/g, '');
                return clean.length >= 10 && clean.length <= 15;
            },
            message: 'Veuillez entrer un numéro de téléphone valide',
        },
        postalCode: {
            validate(val, ctx) {
                const countryInput = $('#country');
                const country = countryInput?.dataset?.countryCode || countryInput?.value || 'FR';
                const patterns = {
                    FR: /^\d{5}$/,
                    BE: /^\d{4}$/,
                    CH: /^\d{4}$/,
                    LU: /^\d{4}$/,
                    DE: /^\d{5}$/,
                    ES: /^\d{5}$/,
                    IT: /^\d{5}$/,
                    US: /^\d{5}(-\d{4})?$/,
                    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
                    GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
                    NL: /^\d{4}\s?[A-Z]{2}$/i,
                    PT: /^\d{4}-\d{3}$/,
                    AU: /^\d{4}$/,
                    NZ: /^\d{4}$/,
                    JP: /^\d{3}-\d{4}$/,
                    KR: /^\d{5}$/,
                    IN: /^\d{6}$/,
                    BR: /^\d{5}-\d{3}$/,
                    AR: /^[A-Z]\d{4}[A-Z]{3}$/i,
                    MX: /^\d{5}$/,
                    ZA: /^\d{4}$/,
                    MA: /^\d{5}$/,
                    TN: /^\d{4}$/,
                    DZ: /^\d{5}$/,
                    SN: /^\d{5}$/,
                    CI: /^\d{2}\s?BP\s?\d{1,4}$/i
                };
                const pattern = patterns[country] || /^[\w\s\-]{3,10}$/;
                return pattern.test(val);
            },
            message: 'Code postal invalide pour le pays sélectionné',
        },
        // ... (garder le reste des règles de validation inchangé)
        cardNumber: {
            validate: (val) => {
                const num = val.replace(/\s/g, '');
                
                // Vérifier la longueur selon le type
                let validLength = false;
                if (/^4/.test(num)) {
                    // Visa: 13, 16, ou 19 chiffres
                    validLength = num.length === 13 || num.length === 16 || num.length === 19;
                } else if (/^5[1-5]/.test(num) || /^2(2(2[1-9]|[3-9]\d)|[3-6]\d\d|7[01]\d|720)/.test(num)) {
                    // Mastercard: 16 chiffres
                    validLength = num.length === 16;
                } else if (/^3[47]/.test(num)) {
                    // American Express: 15 chiffres
                    validLength = num.length === 15;
                } else {
                    // Autres cartes: 13 à 19 chiffres
                    validLength = num.length >= 13 && num.length <= 19;
                }
                
                return validLength && luhnCheck(num);
            },
            message: 'Numéro de carte invalide',
        },
        cardExpiry: {
            validate: (val) => {
                const match = val.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
                if (!match) return false;
                const now = new Date();
                const y = parseInt(match[2]) + 2000;
                const m = parseInt(match[1]);
                return new Date(y, m) > now;
            },
            message: 'Date d\'expiration invalide ou carte expirée',
        },
        cardCVC: {
            validate: (val) => {
                const cardNumber = ($('#cardNumber')?.value || '').replace(/\s/g, '');
                const isAmex = /^3[47]/.test(cardNumber);
                const requiredLength = isAmex ? 4 : 3;
                return /^\d+$/.test(val) && val.length === requiredLength;
            },
            message: 'CVC invalide',
        },
    };

    function luhnCheck(num) {
        let sum = 0, even = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let d = parseInt(num[i], 10);
            if (even) { d *= 2; if (d > 9) d -= 9; }
            sum += d;
            even = !even;
        }
        return sum % 10 === 0;
    }

    function validateField(field) {
        const val = field.value.trim();
        const id = field.id;
        const errorEl = $(`#${id}Error`);
        if (!errorEl) return true;

        // Champ vide ?
        if (field.required && !val) {
            setError(field, errorEl, 'Ce champ est obligatoire');
            return false;
        }

        if (!val) { clearError(field, errorEl); return true; }

        // Règle spécifique ?
        const rule = rules[id];
        if (rule) {
            let valid;
            if (rule.regex) valid = rule.regex.test(val);
            else if (rule.validate) valid = rule.validate(val);
            else valid = true;

            if (!valid) {
                setError(field, errorEl, rule.message);
                return false;
            }
        }

        clearError(field, errorEl);
        return true;
    }

    function setError(field, errorEl, msg) {
        errorEl.textContent = msg;
        field.classList.add('error');
        field.classList.remove('valid');
        field.setAttribute('aria-invalid', 'true');
    }

    function clearError(field, errorEl) {
        errorEl.textContent = '';
        field.classList.remove('error');
        if (field.value.trim()) field.classList.add('valid');
        field.removeAttribute('aria-invalid');
    }

    return { validateField, clearError, luhnCheck };
})();

/* ═══════════════════════════════════════════════════════════════════════════
   APPLICATION CHECKOUT
   ═══════════════════════════════════════════════════════════════════════════ */

// Données de commande
let orderData = {
    shipping: {},
    payment: { method: 'card' },
    cart: [],
    orderNumber: null,
    orderDate: null,
    totals: {},
};

// ─── Initialisation ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
    console.log('🛒 Checkout page initialisée');

    // Vérifier le panier
    const cart = CartModule.getCart();
    if (CartModule.getTotalItems() === 0) {
        alert('Votre panier est vide. Redirection vers la page d\'accueil...');
        window.location.href = '/../../index.html';
        return;
    }

    // Init données
    orderData.cart = [...cart];
    orderData.orderNumber = generateOrderNumber();
    orderData.orderDate = new Date().toISOString();

    // Charger l'UI
    loadOrderSummary();
    updateDeliveryDate();
    setupEventListeners();
    setupFormValidation();

    // Charger les pays en parallèle
    await populateCountries();

    // Remplir données de démo
    fillDemoData();
});

// ─── Pays dynamiques ────────────────────────────────────

async function populateCountries() {
    const countryElement = $('#country');
    if (!countryElement) return;

    // Afficher un indicateur de chargement
    countryElement.disabled = true;
    countryElement.placeholder = 'Chargement des pays...';

    try {
        // Charger les pays depuis l'API
        const countries = await GeoModule.loadCountries();
        
        // Créer ou récupérer le datalist
        let datalist = document.getElementById('countryList');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'countryList';
            countryElement.insertAdjacentElement('afterend', datalist);
        }

        // Si c'est un select, le convertir en input avec autocomplete
        if (countryElement.tagName === 'SELECT') {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'country';
            input.name = 'country';
            input.required = true;
            input.autocomplete = 'country-name';
            input.placeholder = 'Rechercher un pays...';
            input.setAttribute('list', 'countryList');
            input.className = countryElement.className;
            
            countryElement.replaceWith(input);
            input.insertAdjacentElement('afterend', datalist);
        }

        // Remplir le datalist avec DocumentFragment pour la performance
        const frag = document.createDocumentFragment();
        for (const c of countries) {
            const opt = document.createElement('option');
            opt.value = `${c.flag} ${c.name}`;
            opt.dataset.code = c.code;
            opt.dataset.currency = c.currencyCode;
            opt.dataset.phone = c.phoneCode;
            frag.appendChild(opt);
        }
        
        datalist.innerHTML = '';
        datalist.appendChild(frag);

        // Préremplir avec France
        const input = $('#country');
        if (input) {
            input.value = '🇫🇷 France';
            input.dataset.countryCode = 'FR';
            input.dataset.currency = 'EUR';
            input.dataset.phone = '+33';
            
            // Charger les infos du pays
            const countryInfo = await GeoModule.loadCountryInfo('FR');
            
            // Mettre à jour le placeholder du code postal
            const postalInput = $('#postalCode');
            if (postalInput) {
                postalInput.placeholder = GeoModule.getPostalCodeFormat('FR');
                postalInput.title = `Format: ${GeoModule.getPostalCodeFormat('FR')}`;
            }

            // Gérer la sélection et validation du code postal
            input.addEventListener('input', async function() {
                const selectedOption = Array.from(datalist.options).find(
                    opt => opt.value === this.value
                );
                if (selectedOption) {
                    const countryCode = selectedOption.dataset.code;
                    this.dataset.countryCode = countryCode;
                    this.dataset.currency = selectedOption.dataset.currency;
                    this.dataset.phone = selectedOption.dataset.phone;
                    
                    // Charger les infos du pays sélectionné
                    const info = await GeoModule.loadCountryInfo(countryCode);
                    
                    // Mettre à jour le placeholder du code postal
                    const postalInput = $('#postalCode');
                    if (postalInput) {
                        postalInput.placeholder = GeoModule.getPostalCodeFormat(countryCode);
                        postalInput.title = `Format: ${GeoModule.getPostalCodeFormat(countryCode)}`;
                    }
                    
                    // Réinitialiser la ville
                    const cityInput = $('#city');
                    if (cityInput) {
                        cityInput.value = '';
                        cityInput.placeholder = 'Sélectionnez d\'abord un pays';
                    }
                    
                    // Réinitialiser le code postal
                    if (postalInput) {
                        postalInput.value = '';
                    }
                    
                    // Valider le code postal existant
                    if (postalInput && postalInput.value) {
                        ValidationModule.validateField(postalInput);
                    }
                }
            });
        }

        // Réactiver le champ
        input.disabled = false;
        input.placeholder = 'Rechercher un pays...';

    } catch (err) {
        console.error('Erreur lors du chargement des pays:', err);
        countryElement.disabled = false;
        countryElement.placeholder = 'Erreur de chargement - Réessayez';
    }
}

// ─── Autocomplétion des villes avec codes postaux ───────────────

function setupCityAutocomplete() {
    const cityInput = $('#city');
    const dropdown = $('#cityDropdown');
    if (!cityInput || !dropdown) return;

    let highlightIndex = -1;
    let currentCountryCode = 'FR';

    const search = debounce(async function () {
        const query = cityInput.value.trim();
        const countryElement = $('#country');
        const countryCode = countryElement?.dataset?.countryCode || 'FR';
        currentCountryCode = countryCode;

        if (!countryCode) {
            dropdown.innerHTML = '<div class="dropdown-no-results">Veuillez d\'abord sélectionner un pays</div>';
            showDropdown();
            return;
        }

        if (query.length < 2) {
            hideDropdown();
            return;
        }

        // Afficher un loader
        dropdown.innerHTML = '<div class="autocomplete-loading">Recherche des villes...</div>';
        showDropdown();

        try {
            const results = await GeoModule.searchCities(countryCode, query);
            highlightIndex = -1;

            if (results.length === 0) {
                dropdown.innerHTML = '<div class="dropdown-no-results">Aucune ville trouvée</div>';
                return;
            }

            const frag = document.createDocumentFragment();
            results.forEach((city, i) => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.setAttribute('role', 'option');
                item.dataset.index = i;
                item.dataset.city = city.value;
                item.dataset.postalCodes = JSON.stringify(city.postalCodes);
                
                // Afficher le nom de la ville et éventuellement des codes postaux
                let html = `<strong>${city.display}</strong>`;
                if (city.postalCodes && city.postalCodes.length > 0) {
                    const codes = city.postalCodes.slice(0, 3).join(', ');
                    html += `<br><small>CP: ${codes}${city.postalCodes.length > 3 ? '...' : ''}</small>`;
                }
                
                item.innerHTML = html;
                frag.appendChild(item);
            });
            
            dropdown.innerHTML = '';
            dropdown.appendChild(frag);

        } catch (err) {
            dropdown.innerHTML = '<div class="dropdown-error">Erreur de recherche. Veuillez réessayer.</div>';
        }
    }, 300);

    // Événements input
    cityInput.addEventListener('input', search);

    // Click sur un item (event delegation)
    dropdown.addEventListener('click', async function (e) {
        const item = e.target.closest('.dropdown-item');
        if (item) {
            const cityName = item.dataset.city;
            cityInput.value = cityName;
            
            // Charger les codes postaux pour cette ville
            const postalCodes = JSON.parse(item.dataset.postalCodes || '[]');
            
            if (postalCodes.length > 0) {
                // Si on a des codes postaux, suggérer le premier
                const postalInput = $('#postalCode');
                if (postalInput && !postalInput.value) {
                    postalInput.value = postalCodes[0];
                    ValidationModule.validateField(postalInput);
                }
            } else {
                // Sinon, essayer de récupérer les codes postaux via l'API
                try {
                    const codes = await GeoModule.getPostalCodesForCity(currentCountryCode, cityName);
                    if (codes.length > 0) {
                        const postalInput = $('#postalCode');
                        if (postalInput && !postalInput.value) {
                            postalInput.value = codes[0];
                            ValidationModule.validateField(postalInput);
                        }
                    }
                } catch (err) {
                    // Ignorer l'erreur
                }
            }
            
            hideDropdown();
            cityInput.classList.add('valid');
            cityInput.classList.remove('error');
            const errEl = $('#cityError');
            if (errEl) errEl.textContent = '';
        }
    });

    // Navigation clavier
    cityInput.addEventListener('keydown', function (e) {
        const items = $$('.dropdown-item', dropdown);
        if (!items.length || !dropdown.classList.contains('visible')) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightIndex = Math.min(highlightIndex + 1, items.length - 1);
            updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightIndex = Math.max(highlightIndex - 1, 0);
            updateHighlight(items);
        } else if (e.key === 'Enter' && highlightIndex >= 0) {
            e.preventDefault();
            items[highlightIndex]?.click();
        } else if (e.key === 'Escape') {
            hideDropdown();
        }
    });

    // Fermer au clic extérieur
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#cityAutocomplete')) {
            hideDropdown();
        }
    });

    function showDropdown() {
        dropdown.classList.add('visible');
        cityInput.setAttribute('aria-expanded', 'true');
    }

    function hideDropdown() {
        dropdown.classList.remove('visible');
        cityInput.setAttribute('aria-expanded', 'false');
        highlightIndex = -1;
    }

    function updateHighlight(items) {
        items.forEach((it, i) => {
            it.classList.toggle('highlighted', i === highlightIndex);
        });
        if (highlightIndex >= 0) {
            items[highlightIndex].scrollIntoView({ block: 'nearest' });
        }
    }
}

// ─── Récapitulatif de commande ──────────────────────────
// ... (garder cette fonction inchangée) ...
function loadOrderSummary() {
    const cart = CartModule.getCart();
    const container = $('#orderItems');
    if (!container) return;

    // Utiliser DocumentFragment pour la performance
    const frag = document.createDocumentFragment();

    cart.forEach((item, i) => {
        const total = item.price * item.quantity;
        const el = document.createElement('div');
        el.className = 'order-item';
        el.style.animationDelay = `${i * 0.05}s`;
        el.innerHTML = `
            <div class="order-item-info">
                <div class="order-item-name">${escapeHtml(item.name)}</div>
                <div class="order-item-details">${item.quantity} × ${formatPrice(item.price)}</div>
            </div>
            <div class="order-item-price">${formatPrice(total)}</div>
        `;
        frag.appendChild(el);
    });

    container.innerHTML = '';
    container.appendChild(frag);
    updateOrderTotals();
}

function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, c => map[c]);
}

function updateOrderTotals() {
    const subtotal = CartModule.getTotalPrice();
    const shipping = subtotal >= 50 ? 0 : 4.90;
    const tax = subtotal * 0.20;
    const total = subtotal + shipping + tax;

    $('#summarySubtotal').textContent = formatPrice(subtotal);
    $('#summaryTax').textContent = formatPrice(tax);
    $('#summaryTotal').textContent = formatPrice(total);

    // Badge livraison gratuite
    const shippingEl = $('#summaryShipping');
    if (shipping === 0) {
        shippingEl.innerHTML = '<span class="free-shipping-badge">Gratuit</span>';
    } else {
        shippingEl.textContent = formatPrice(shipping);
    }

    // Stocker les totaux
    orderData.totals = { subtotal, shipping, tax, total };
}

// ─── Date de livraison ──────────────────────────────────
// ... (garder cette fonction inchangée) ...
function updateDeliveryDate() {
    const delivery = new Date();
    let added = 0;
    while (added < 3) {
        delivery.setDate(delivery.getDate() + 1);
        const day = delivery.getDay();
        if (day !== 0 && day !== 6) added++;
    }

    const formatted = delivery.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const el = $('#deliveryDate');
    if (el) el.textContent = `Date de livraison estimée : ${formatted}`;
    orderData.estimatedDelivery = formatted;
}

// ─── Événements ─────────────────────────────────────────
// ... (garder cette fonction inchangée mais s'assurer que setupCityAutocomplete est appelée) ...
function setupEventListeners() {
    // Soumission
    $('#submitOrder')?.addEventListener('click', processOrder);

    // Méthodes de paiement — Event delegation
    const paymentContainer = document.querySelector('.payment-methods');
    if (paymentContainer) {
        paymentContainer.addEventListener('click', function (e) {
            const header = e.target.closest('.payment-method-header');
            if (!header) return;
            const method = header.closest('.payment-method')?.dataset.method;
            if (method) switchPaymentMethod(method);
        });
    }

    // Formatage carte — event delegation sur la section paiement
    const cardSection = document.querySelector('[data-method="card"] .payment-method-content');
    if (cardSection) {
        cardSection.addEventListener('input', function (e) {
            const id = e.target.id;
            if (id === 'cardNumber') formatCardNumber(e);
            else if (id === 'cardExpiry') formatCardExpiry(e);
            else if (id === 'cardCVC') formatCardCVC(e);
        });
    }

    // Détection automatique du type de carte
    $('#cardNumber')?.addEventListener('input', detectCardType);

    // Modal
    $('#continueShopping')?.addEventListener('click', () => {
        window.location.href = '/../../index.html';
    });
    document.querySelector('#trackOrder')?.addEventListener('click', () => {
    window.open('/pages/commande/track-order.html', '_blank');
    });

    document.querySelector('#viewInvoice')?.addEventListener('click', () => {
    window.open('/pages/commande/facture.html', '_blank');
    });

    document.querySelector('#modalClose')?.addEventListener('click', hideConfirmationModal);

    const modal = $('#confirmationModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideConfirmationModal();
        });
    }

    // Changement de pays → réinitialiser villes
    $('#country')?.addEventListener('input', function () {
        const cityInput = $('#city');
        if (cityInput) {
            cityInput.value = '';
            cityInput.classList.remove('valid', 'error');
            cityInput.placeholder = 'Commencez à taper le nom de la ville...';
        }
        
        // Mettre à jour le placeholder du code postal
        const countryCode = this.dataset.countryCode || this.value;
        const postalInput = $('#postalCode');
        if (postalInput && countryCode) {
            postalInput.placeholder = GeoModule.getPostalCodeFormat(countryCode);
            postalInput.title = `Format: ${GeoModule.getPostalCodeFormat(countryCode)}`;
        }
    });

    // Initialiser l'autocomplétion des villes
    setupCityAutocomplete();
}

// ─── Validation du formulaire ───────────────────────────
// ... (garder cette fonction inchangée) ...
function setupFormValidation() {
    const form = $('#shippingForm');
    if (!form) return;

    // Validation au blur
    form.addEventListener('blur', function (e) {
        if (e.target.matches('input[required], select[required]')) {
            ValidationModule.validateField(e.target);
        }
    }, true); // capture phase pour blur

    // Nettoyage au input (debounced)
    const debouncedClear = debounce(function (field) {
        const errEl = $(`#${field.id}Error`);
        if (errEl) {
            errEl.textContent = '';
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        }
    }, 150);

    form.addEventListener('input', function (e) {
        if (e.target.matches('input, select, textarea')) {
            debouncedClear(e.target);
        }
    });

    // Validation temps réel (debounced) pour email, téléphone, code postal
    const realtimeFields = ['email', 'phone', 'postalCode'];
    realtimeFields.forEach(id => {
        const field = $(`#${id}`);
        if (field) {
            field.addEventListener('input', debounce(function () {
                if (this.value.trim()) ValidationModule.validateField(this);
            }, 400));
        }
    });
}

// ─── Paiement ───────────────────────────────────────────
// ... (garder ces fonctions inchangées) ...
function switchPaymentMethod(method) {
    $$('.payment-method').forEach(el => el.classList.remove('active'));
    const selected = $(`[data-method="${method}"]`);
    if (selected) {
        selected.classList.add('active');
        const radio = $('input[type="radio"]', selected);
        if (radio) radio.checked = true;
    }
    orderData.payment.method = method;
}

function formatCardNumber(e) {
    const raw = e.target.value.replace(/\D/g, '');
    const parts = [];
    for (let i = 0; i < raw.length && i < 16; i += 4) {
        parts.push(raw.substring(i, i + 4));
    }
    e.target.value = parts.join(' ');
}

function formatCardExpiry(e) {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
    e.target.value = val.substring(0, 5);
}

function formatCardCVC(e) {
    const cardNumber = ($('#cardNumber')?.value || '').replace(/\s/g, '');
    const isAmex = /^3[47]/.test(cardNumber);
    const maxLength = isAmex ? 4 : 3;
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, maxLength);
}

function detectCardType() {
    const num = ($('#cardNumber')?.value || '').replace(/\s/g, '');
    const logos = $$('.card-logos i');

    // Reset
    logos.forEach(l => l.classList.remove('active'));

    if (!num) return;

    // Détection précise des cartes
    if (/^4/.test(num)) {
        // Visa: commence par 4
        $('.fa-cc-visa', document.querySelector('.card-logos'))?.classList.add('active');
    } else if (/^5[1-5]/.test(num) || /^2(2(2[1-9]|[3-9]\d)|[3-6]\d\d|7[01]\d|720)/.test(num)) {
        // Mastercard: 51-55 OU 2221-2720
        $('.fa-cc-mastercard', document.querySelector('.card-logos'))?.classList.add('active');
    } else if (/^3[47]/.test(num)) {
        // American Express: 34 ou 37
        $('.fa-cc-amex', document.querySelector('.card-logos'))?.classList.add('active');
    }
}

// ─── Traitement de commande ─────────────────────────────
// ... (garder ces fonctions inchangées) ...
function processOrder() {
    console.log('🔄 Traitement de la commande...');

    if (!validateForm()) {
        // Scroll vers la première erreur
        const firstErr = document.querySelector('.error-message:not(:empty)');
        if (firstErr) {
            firstErr.closest('.form-group')?.scrollIntoView({
                behavior: 'smooth', block: 'center'
            });
        }
        return;
    }

    collectFormData();
    simulatePaymentProcessing();
}

function validateForm() {
    const form = $('#shippingForm');
    if (!form) return false;
    let valid = true;

    $$('input[required], select[required]', form).forEach(field => {
        if (!ValidationModule.validateField(field)) valid = false;
    });

    // Valider les champs carte si paiement par carte
    if (orderData.payment.method === 'card') {
        ['cardNumber', 'cardName', 'cardExpiry', 'cardCVC'].forEach(id => {
            const field = $(`#${id}`);
            if (field) {
                if (!field.value.trim()) {
                    const errEl = $(`#${id}Error`);
                    if (errEl) {
                        errEl.textContent = 'Ce champ est obligatoire';
                        field.classList.add('error');
                    }
                    valid = false;
                } else if (!ValidationModule.validateField(field)) {
                    valid = false;
                }
            }
        });
    }

    return valid;
}

function collectFormData() {
    const countryInput = $('#country');
    const countryCode = countryInput?.dataset?.countryCode || 'FR';
    const countryName = countryInput?.value || 'France';
    
    orderData.shipping = {
        firstName: $('#firstName').value.trim(),
        lastName: $('#lastName').value.trim(),
        email: $('#email').value.trim(),
        phone: $('#phone').value.trim(),
        address: $('#address').value.trim(),
        postalCode: $('#postalCode').value.trim(),
        city: $('#city').value.trim(),
        country: countryName,
        countryCode: countryCode,
        instructions: $('#deliveryInstructions').value.trim(),
    };

    if (orderData.payment.method === 'card') {
        orderData.payment.details = {
            cardNumber: $('#cardNumber').value.trim(),
            cardName: $('#cardName').value.trim(),
            cardExpiry: $('#cardExpiry').value.trim(),
            // Ne pas stocker le CVC dans les données finales (sécurité)
        };
    }
}

function simulatePaymentProcessing() {
    const btn = $('#submitOrder');
    if (!btn) return;

    btn.disabled = true;
    btn.classList.add('loading');
    btn.setAttribute('aria-busy', 'true');

    console.log('💳 Début de la simulation de paiement...');
    
    // Afficher le modal de chargement
    const loadingModal = $('#paymentLoadingModal');
    const stepElement = $('#paymentStep');
    
    if (loadingModal) {
        loadingModal.classList.add('show');
        loadingModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    // Étape 1 : Vérification des informations (1s)
    if (stepElement) stepElement.textContent = 'Vérification des informations bancaires...';
    
    setTimeout(() => {
        // Étape 2 : Connexion à la banque (1.5s)
        if (stepElement) stepElement.textContent = 'Connexion sécurisée avec votre banque...';
        
        setTimeout(() => {
            // Étape 3 : Autorisation (1.5s)
            if (stepElement) stepElement.textContent = 'Demande d\'autorisation en cours...';
            
            setTimeout(() => {
                // Étape 4 : Validation (1s)
                if (stepElement) stepElement.textContent = 'Validation du paiement...';
                
                setTimeout(() => {
                    console.log('✅ Paiement réussi !');
                    
                    // Cacher le modal de chargement
                    if (loadingModal) {
                        loadingModal.classList.remove('show');
                        loadingModal.setAttribute('aria-hidden', 'true');
                    }
                    
                    btn.classList.remove('loading');
                    btn.removeAttribute('aria-busy');
                    document.body.style.overflow = '';

                    // Générer les données de commande
                    orderData.orderNumber = generateOrderNumber();
                    orderData.orderDate = new Date().toLocaleString('fr-FR');
                    
                    // Ajouter une date de livraison estimée (7 jours ouvrés)
                    const deliveryDate = new Date();
                    deliveryDate.setDate(deliveryDate.getDate() + 7);
                    orderData.estimatedDelivery = deliveryDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    // Sauvegarder dans localStorage pour la page facture
                    localStorage.setItem('lastOrder', JSON.stringify(orderData));

                    CartModule.clearCart();
                    
                    // Afficher le modal de confirmation
                    showConfirmationModal();
                }, 1000);
            }, 1500);
        }, 1500);
    }, 1000);
}

// ─── Utilitaires commande ───────────────────────────────
// ... (garder ces fonctions inchangées) ...
function generateOrderNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ECHO-${ts}${rand}`;
}

function showConfirmationModal() {
    const modal = $('#confirmationModal');
    if (!modal) return;

    // Remplir les données
    const ref = orderData.orderNumber;
    $('#orderNumber').textContent = ref.split('-')[1] || ref;
    $('#orderReference').textContent = ref;
    $('#orderAmount').textContent = formatPrice(orderData.totals.total);
    $('#estimatedDelivery').textContent = orderData.estimatedDelivery;
    $('#customerEmail').textContent = orderData.shipping.email;

    // Afficher
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Animation
    const icon = modal.querySelector('.confirmation-icon');
    if (icon) icon.classList.add('success-animation');

    // Focus sur le modal (accessibilité)
    modal.querySelector('.modal-close')?.focus();
}

function hideConfirmationModal() {
    const modal = $('#confirmationModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// ─── Données de démo ────────────────────────────────────
// ... (garder cette fonction inchangée) ...
function fillDemoData() {
    const firstName = $('#firstName');
    if (!firstName || firstName.value !== '') return;

    console.log('📝 Remplissage des données de démo...');

    const demoData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        postalCode: '',
        city: '',
        country: '',
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCVC: '',
    };

    Object.entries(demoData).forEach(([id, value]) => {
        const el = $(`#${id}`);
        if (el) el.value = value;
    });

    // Déclencher la détection du type de carte
    detectCardType();
}

// ─── API publique ───────────────────────────────────────

window.CheckoutModule = {
    validateForm,
    processOrder,
    getOrderData: () => ({ ...orderData }),
    fillDemoData,
    GeoModule,
};