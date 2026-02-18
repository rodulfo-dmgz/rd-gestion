/* ===============================
   COMPTABILITÉ - Gestion des écritures avec Supabase
   Structure calquée sur index-admin.js
   =============================== */

import { supabase, signOut } from '../../core/config/supabase.js';
import { MESSAGES_FEMME, MESSAGES_HOMME } from '../../core/config/messages.js';
import { APP_CONFIG } from '../../core/config/config.js';
import { navigateTo, buildPath } from '../../core/utils/Pathutils.js';


// ============================================================================
// GUARD ANTI-BOUCLE DE REDIRECTION
// ============================================================================
const REDIRECT_KEY     = 'ca_redirect_ts';
const REDIRECT_TIMEOUT = 3000; // ms

function safeRedirectToLogin() {
    const lastRedirect = parseInt(sessionStorage.getItem(REDIRECT_KEY) || '0', 10);
    const now = Date.now();

    if (now - lastRedirect < REDIRECT_TIMEOUT) {
        console.error('🔴 Boucle de redirection détectée — arrêt forcé');
        showFatalError(
            'Boucle de redirection détectée',
            'La session ou le profil est introuvable après redirection. ' +
            'Vérifiez que user_profile et current_entreprise sont bien stockés dans localStorage après le login.'
        );
        return;
    }

    sessionStorage.setItem(REDIRECT_KEY, String(now));
    console.warn('⚠️ Redirection vers login');
    navigateTo('/index.html');
}

// ============================================================================
// ÉCRAN D'ERREUR FATAL
// ============================================================================
function showFatalError(title, detail) {
    const loginPath = buildPath('/index.html');
    
    document.body.innerHTML = `
        <div style="
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            height:100vh; font-family:system-ui,sans-serif; background:#0f172a; color:#f8fafc;
            padding:2rem; text-align:center;
        ">
            <div style="
                background:#1e293b; border:1px solid #ef4444; border-radius:12px;
                padding:2rem 2.5rem; max-width:520px; width:100%;
            ">
                <div style="font-size:2.5rem; margin-bottom:1rem;">🔴</div>
                <h2 style="color:#ef4444; margin:0 0 0.75rem; font-size:1.25rem;">${title}</h2>
                <p style="color:#94a3b8; margin:0 0 1.5rem; font-size:0.875rem; line-height:1.6;">${detail}</p>
                <div style="
                    background:#0f172a; border-radius:8px; padding:1rem;
                    font-family:monospace; font-size:0.75rem; color:#64748b;
                    text-align:left; margin-bottom:1.5rem;
                " id="debug-dump">Chargement des infos debug...</div>
                <a href="${loginPath}" style="
                    display:inline-block; padding:0.6rem 1.5rem;
                    background:#3b82f6; color:#fff; border-radius:8px;
                    text-decoration:none; font-size:0.875rem; font-weight:600;
                ">← Retour au login</a>
            </div>
        </div>
    `;

    const dump = {
        user_profile:       localStorage.getItem('user_profile')       ? '✅ présent' : '❌ absent',
        current_entreprise: localStorage.getItem('current_entreprise') ? '✅ présent' : '❌ absent',
        debug_ignore_tenant: localStorage.getItem('debug_ignore_tenant') || 'non défini',
        href: window.location.href,
        timestamp: new Date().toISOString()
    };

    const el = document.getElementById('debug-dump');
    if (el) el.textContent = JSON.stringify(dump, null, 2);
}

// ============================================================================
// VÉRIFICATION AUTH
// ============================================================================
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('❌ Erreur getSession:', error.message);
            showFatalError('Erreur Supabase Auth', `getSession() a retourné une erreur : ${error.message}`);
            return null;
        }

        if (!session) {
            console.warn('⚠️ Aucune session active');
            safeRedirectToLogin();
            return null;
        }

        const userProfile = JSON.parse(localStorage.getItem('user_profile') || 'null');
        const entreprise  = JSON.parse(localStorage.getItem('current_entreprise') || 'null');

        if (!userProfile) {
            console.error('❌ user_profile absent du localStorage');
            showFatalError(
                'Profil utilisateur manquant',
                'La session Supabase est active mais user_profile est absent du localStorage. ' +
                'Reconnectez-vous pour que le login le réécrire.'
            );
            return null;
        }

        if (!entreprise) {
            console.error('❌ current_entreprise absent du localStorage');
            showFatalError(
                'Entreprise manquante',
                'La session Supabase est active mais current_entreprise est absent du localStorage. ' +
                'Reconnectez-vous pour que le login le réécrire.'
            );
            return null;
        }

        sessionStorage.removeItem(REDIRECT_KEY);
        return { user: userProfile, tenant: entreprise };

    } catch (err) {
        console.error('❌ Exception dans checkAuth:', err);
        showFatalError('Erreur inattendue dans checkAuth', err.message);
        return null;
    }
}

// ============================================================================
// INITIALISATION
// ============================================================================
(async function init() {
    console.log('🚀 Initialisation Comptabilité...');

    const auth = await checkAuth();
    if (!auth) return;

    const user                = auth.user;
    const tenant              = auth.tenant;
    const tenantId            = tenant.id;
    const tenantRaisonSociale = tenant.raison_sociale || 'CRM';

    console.log('🔎 Tenant ID :', tenantId);

    const IGNORE_TENANT_FILTER = localStorage.getItem('debug_ignore_tenant') === 'true';
    if (IGNORE_TENANT_FILTER) console.warn('⚠️ Mode diagnostic : filtre entreprise_id ignoré !');

    // ==================== AFFICHAGE EN-TÊTE ====================

          // 👇 Ajout du nom de l'application
      const brandElement = document.querySelector('.company-name');
      if (brandElement) {
          brandElement.innerText = APP_CONFIG.APP_NAME;
      }

    document.app = (APP_CONFIG.APP_NAME);
    // On récupère la civilité de l'utilisateur (on gère les majuscules/minuscules au cas où)
  const civilite = (user.civilite || '').trim(); // Attendu: "M.", "Mme" ou "Mlle"
  let messageList;

  // 1. Choix du tableau selon la civilité
  if (civilite === "Mme" || civilite === "Mlle") {
      messageList = MESSAGES_FEMME;
  } else if (civilite === "M.") {
      messageList = MESSAGES_HOMME;
  } else {
      // Optionnel : un tableau de repli si la civilité est manquante
      messageList = MESSAGES_HOMME; 
  }

  // 2. Sélection aléatoire dans le bon tableau
  const randomIndex = Math.floor(Math.random() * messageList.length);
  const rawMessage = messageList[randomIndex];

  // 3. Injection du prénom et affichage
  const welcomeText = rawMessage.replace('{prenom}', user.prenom);
  document.getElementById("welcome").innerText = welcomeText;
    const userInfo = user.role === 'stagiaire' ? 'Comptable assistant' : (user.metier || user.role);
    document.getElementById("user-info").innerText = userInfo;
    document.getElementById("tenant-context").innerText = `Vous êtes connecté sur la base de données de : ${tenantRaisonSociale}`;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // ==================== GESTION DES PERMISSIONS ====================
    function getAccessibleModules(user) {
        const serviceModules = {
            'admin':    ['clients', 'produits', 'ventes', 'planning', 'SIRH', 'comptabilite', 'factures', 'statistiques'],
            'formateur':['clients', 'produits', 'ventes', 'planning', 'SIRH', 'comptabilite', 'factures', 'statistiques'],
            'stagiaire': {
                'comptable_assistant':           ['comptabilite', 'clients', 'ventes', 'factures'],
                'gestionnaire_comptable_fiscal': ['comptabilite', 'factures', 'statistiques']
            }
        };
        if (user.role === 'stagiaire') return serviceModules.stagiaire[user.metier] || [];
        return serviceModules[user.role] || serviceModules['admin'];
    }

    const modules = getAccessibleModules(user);

    if (!modules.includes('comptabilite')) {
        showFatalError(
            'Accès refusé',
            `Le rôle "${user.role}" / métier "${user.metier}" n'a pas accès au module Comptabilité.`
        );
        return;
    }

    // ==================== NAVIGATION ====================
    function generateNavigation() {
    const nav = document.getElementById("sidebar-nav");
    if (!nav) return;
    nav.innerHTML = '';

    // ----- LIEN DASHBOARD -----
    const dashboardLink = document.createElement('a');
    dashboardLink.href = 'index-ca.html';
    dashboardLink.innerHTML = '<i data-lucide="layout-dashboard"></i> Dashboard';
    if (window.location.pathname.includes('index-ca.html')) {
        dashboardLink.classList.add('active');
    }
    nav.appendChild(dashboardLink);

    // ----- SÉPARATEUR -----
    const separator = document.createElement('hr');
    separator.style.margin = '.1rem 0';
    separator.style.borderColor = 'var(--border-light)';
    nav.appendChild(separator);
    

    // Onglets principaux avec leurs URLs
    const mainTabs = [
        { label: 'Quotidien', url: 'quotidien.html', icon: 'calendar' },
        { label: 'Trésorerie', url: 'tresorerie.html', icon: 'wallet' },
        { label: 'Consultation', url: 'consultation.html', icon: 'search' },
        { label: 'Déclaratif', url: 'declaratif.html', icon: 'file-text' },
        { label: 'Clôture', url: 'cloture.html', icon: 'lock' }
    ];

    mainTabs.forEach(tab => {
        const link = document.createElement('a');
        link.href = tab.url;
        link.innerHTML = `<i data-lucide="${tab.icon}"></i> ${tab.label}`;
        // Optionnel : marquer l'onglet actif si l'URL correspond à la page courante
        if (window.location.pathname.includes(tab.url)) {
            link.classList.add('active');
        }
        nav.appendChild(link);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

    // ==================== TABLES AVEC ENTREPRISE_ID ====================
    const tablesWithTenant = [
        'clients', 'fournisseurs', 'produits', 'factures_clients', 'factures_fournisseurs',
        'devis', 'paiements', 'categories_produits', 'plan_comptable', 'journaux',
        'taux_tva', 'modes_reglement', 'exercices', 'periodes', 'ecritures',
        'avoirs_clients', 'avoirs_fournisseurs', 'immobilisations', 'amortissements',
        'rapprochements_bancaires', 'mouvements_stock'
    ];

// ==================== KPI COMPTABLES (VUE DASHBOARD) ====================
async function generateKPIs() {
    const kpiGrid = document.getElementById('kpi-grid');
    if (!kpiGrid) return;
    kpiGrid.innerHTML = '';

    // Récupérer les données de la vue v_dashboard_kpi
    let query = supabase
        .from('v_dashboard_kpi')
        .select('*');

    if (!IGNORE_TENANT_FILTER && tenantId) {
        query = query.eq('entreprise_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('❌ Erreur chargement vue dashboard:', error.message);
        kpiGrid.innerHTML = `<div class="error-message">Impossible de charger les indicateurs: ${error.message}</div>`;
        return;
    }

    // S'il n'y a pas de données (aucune ligne), afficher un message
    if (!data || data.length === 0) {
        kpiGrid.innerHTML = `<div class="info-message">Aucun indicateur disponible pour cette entreprise.</div>`;
        return;
    }

    const row = data[0]; // On prend la première ligne (normalement une seule par entreprise/exercice)

    const kpiDefinitions = [
        { label: 'Chiffre d\'affaires (net)', field: 'ca_net', suffix: ' €', format: 'number' },
        { label: 'Achats', field: 'achats', suffix: ' €', format: 'number' },
        { label: 'Marge brute', field: 'marge_brute', suffix: ' €', format: 'number' },
        { label: 'Taux de marge', field: 'taux_marge', suffix: ' %', format: 'percent' },
        { label: 'Trésorerie', field: 'tresorerie', suffix: ' €', format: 'number' },
        { label: 'BFR', field: 'bfr', suffix: ' €', format: 'number' },
        { label: 'Capitaux propres', field: 'capitaux_propres', suffix: ' €', format: 'number' },
        { label: 'Créances clients', field: 'creances_clients', suffix: ' €', format: 'number' },
        { label: 'Dettes fournisseurs', field: 'dettes_fournisseurs', suffix: ' €', format: 'number' },
    ];

    for (const def of kpiDefinitions) {
        const kpiElement = document.createElement('article');
        kpiElement.className = 'kpi';

        let value = row[def.field];
        if (value === null || value === undefined) {
            value = '—';
        } else {
            if (def.format === 'number') {
                value = parseFloat(value).toFixed(2) + (def.suffix || '');
            } else if (def.format === 'percent') {
                value = parseFloat(value).toFixed(1) + (def.suffix || '%');
            } else {
                value = value + (def.suffix || '');
            }
        }

        kpiElement.innerHTML = `
            <span class="kpi-label">${def.label}</span>
            <span class="kpi-value">${value}</span>
        `;
        kpiGrid.appendChild(kpiElement);
    }
}

    // ==================== ÉTAT LOCAL ====================
    let allEntries = [];
    let editingId  = null;

    // ==================== CHARGEMENT DES ÉCRITURES ====================
    async function loadEntries() {
        try {
            let query = supabase
                .from('ecritures')
                .select('id, date_ecriture, libelle, numero_compte, debit, credit')
                .order('date_ecriture', { ascending: false });

            if (!IGNORE_TENANT_FILTER && tenantId) query = query.eq('entreprise_id', tenantId);

            const { data, error } = await query;

            if (error) { console.warn('⚠️ Écritures inaccessibles:', error.message); renderTable([]); return; }
            allEntries = data || [];
            renderTable(allEntries);
        } catch (err) {
            console.error('❌ loadEntries:', err);
            renderTable([]);
        }
    }

    // ==================== RENDU DU TABLEAU ====================
    function renderTable(entries) {
        const tbody = document.querySelector('#accounting-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!entries.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;">Aucune écriture trouvée</td></tr>`;
            return;
        }

        entries.forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${e.id}</td>
                <td>${e.date_ecriture ? new Date(e.date_ecriture).toLocaleDateString('fr-FR') : '—'}</td>
                <td>${e.libelle       || '—'}</td>
                <td>${e.numero_compte || '—'}</td>
                <td>${e.debit  != null ? parseFloat(e.debit).toFixed(2)  + ' €' : '—'}</td>
                <td>${e.credit != null ? parseFloat(e.credit).toFixed(2) + ' €' : '—'}</td>
                <td>
                    <button class="btn-view"   data-id="${e.id}" title="Voir"><i data-lucide="eye"></i></button>
                    <button class="btn-edit"   data-id="${e.id}" title="Modifier"><i data-lucide="pencil"></i></button>
                    <button class="btn-delete" data-id="${e.id}" title="Supprimer"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        tbody.querySelectorAll('.btn-view').forEach(b   => b.addEventListener('click', () => openViewModal(b.dataset.id)));
        tbody.querySelectorAll('.btn-edit').forEach(b   => b.addEventListener('click', () => openEditModal(b.dataset.id)));
        tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => deleteEntry(b.dataset.id)));
    }



    // ==================== DÉCONNEXION ====================
    document.getElementById('logout')?.addEventListener('click', async () => {
        sessionStorage.removeItem(REDIRECT_KEY);
        await signOut();
    });

    // ==================== LANCEMENT ====================
    try {
        generateNavigation();
        await generateKPIs();
        await loadEntries();
        console.log('✅ Module Comptabilité initialisé');
    } catch (err) {
        console.error('❌ Erreur initialisation:', err);
        showFatalError('Erreur lors de l\'initialisation', err.message);
    }
})();