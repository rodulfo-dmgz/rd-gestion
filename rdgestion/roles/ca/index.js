// =============================================
// DASHBOARD CA - COMPTABLE ASSISTANT
// =============================================

// Vérification utilisateur connecté
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  window.location.href = "../../index.html";
}
if (user.service !== "CA" && !user.acces_total) {
  alert("Accès non autorisé");
  window.location.href = "../../dashboard.html";
}

// ─────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────
document.getElementById("user-info").innerHTML = `<i data-lucide="user"></i> ${user.nom} - ${user.role}`;
document.getElementById("logout").onclick = () => {
  localStorage.removeItem("user");
  window.location.href = "../../index.html";
};

// Date du jour
const currentDate = new Date().toLocaleDateString('fr-FR', { 
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
});
document.getElementById("current-date").textContent = currentDate;

// ─────────────────────────────────────────────
// SIDEBAR : navigation complémentaire (modules CA)
// ─────────────────────────────────────────────
function generateSidebarNav() {
  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = '';

  const caModules = [
    { url: "modules/journal.html", label: "Journal", icon: "book-open" },
    { url: "modules/clients.html", label: "Clients", icon: "users" },
    { url: "modules/fournisseurs.html", label: "Fournisseurs", icon: "truck" },
    { url: "modules/banque.html", label: "Banque", icon: "landmark" },
    { url: "modules/declarations.html", label: "Déclarations", icon: "file-text" },
    { url: "modules/cloture.html", label: "Clôture", icon: "archive" }
  ];

  caModules.forEach(mod => {
    const link = document.createElement("a");
    link.href = mod.url;
    link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
    nav.appendChild(link);
  });
  lucide.createIcons();
}
generateSidebarNav();

// ─────────────────────────────────────────────
// CHARGEMENT NOM ENTREPRISE
// ─────────────────────────────────────────────
fetch("../../data/entreprise.json")
  .then(r => r.json())
  .then(data => {
    document.getElementById("company-name").textContent = data.nom || "CRM";
  })
  .catch(console.error);

// ─────────────────────────────────────────────
// DONNÉES ET STATISTIQUES (Supabase + mock)
// ─────────────────────────────────────────────
let ecritures = [];
let echeances = [];
let relances = [];

async function loadData() {
  try {
    const { data: ecrituresData } = await supabaseClient
      .from('compta_ecritures')
      .select('*')
      .order('date_ecriture', { ascending: false })
      .limit(10);
    ecritures = ecrituresData || generateMockEcritures();

    const { data: echeancesData } = await supabaseClient
      .from('compta_echeances')
      .select('*')
      .eq('type', 'client')
      .gte('date_echeance', new Date().toISOString().split('T')[0]);
    echeances = echeancesData || generateMockEcheances();

    relances = generateMockRelances();
    updateStats();
  } catch {
    ecritures = generateMockEcritures();
    echeances = generateMockEcheances();
    relances = generateMockRelances();
    updateStats();
  }
}

function updateStats() {
  const today = new Date().toISOString().slice(0, 10);
  animateValue('stat-ecritures', 0, ecritures.filter(e => e.date_ecriture === today).length, 1000);
  animateValue('stat-echeances', 0, echeances.filter(e => e.date_echeance === today).length, 1200);
  animateValue('stat-relances', 0, relances.length, 1400);
  animateValue('stat-tresorerie', 0, (Math.random() * 500 + 200).toFixed(1), 1600);
}

function animateValue(id, start, end, duration) {
  const el = document.getElementById(id);
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      el.textContent = Math.round(end);
      clearInterval(timer);
    } else {
      el.textContent = Math.round(current);
    }
  }, 16);
}

// ─────────────────────────────────────────────
// DÉFINITION DES SOUS‑ONGLETS (structure)
// ─────────────────────────────────────────────
const subTabsDefinition = {
  quotidien: [
    { id: 'saisie-journal', label: 'Saisie journal', icon: 'pen-square' },
    { id: 'saisie-kilometre', label: 'Saisie au kilomètre', icon: 'map' },
    { id: 'ventes-comptoir', label: 'Ventes comptoir', icon: 'shopping-cart' },
    { id: 'abonnements', label: 'Abonnements préparés', icon: 'refresh-cw' },
    { id: 'od-salaries', label: 'OD de salariés', icon: 'users' }
  ],
  tresorerie: [
    { id: 'echeancier-client', label: 'Échéancier client', icon: 'calendar' },
    { id: 'reglements-client', label: 'Règlements client', icon: 'credit-card' },
    { id: 'remises-banque', label: 'Remises en banque', icon: 'landmark' },
    { id: 'prelevements', label: 'Prélèvements', icon: 'download' },
    { id: 'effets-client', label: 'Effets de commerce', icon: 'file' },
    { id: 'relances', label: 'Relances', icon: 'alert-triangle' },
    { divider: true },
    { id: 'echeancier-fournisseur', label: 'Échéancier fournisseur', icon: 'calendar' },
    { id: 'reglements-fournisseur', label: 'Règlements fournisseur', icon: 'credit-card' },
    { id: 'virements', label: 'Virements', icon: 'arrow-right' },
    { id: 'effets-fournisseur', label: 'Effets fournisseur', icon: 'file' },
    { divider: true },
    { id: 'releves', label: 'Relevés bancaires', icon: 'file-text' },
    { id: 'rapprochement', label: 'Rapprochement bancaire', icon: 'check-square' },
    { id: 'chequiers', label: 'Chéquiers', icon: 'book' },
    { divider: true },
    { id: 'lettrage', label: 'Lettrage', icon: 'link' },
    { id: 'assistant-lettrage', label: 'Assistants de lettrage', icon: 'wand' }
  ],
  consultation: [
    { id: 'recherche-ecritures', label: 'Recherche d\'écritures', icon: 'search' },
    { id: 'consultation-comptes', label: 'Consultation des comptes', icon: 'folder' },
    { id: 'grand-livre', label: 'Grand livre interactif général', icon: 'book-open' },
    { id: 'inter-exercices', label: 'Consultation inter-exercices', icon: 'layers' },
    { id: 'balance', label: 'Balance interactive générale', icon: 'scale' },
    { id: 'balance-inter', label: 'Balance inter-exercices', icon: 'copy' },
    { id: 'charges-produits', label: 'Charges et produits constatés', icon: 'trending-up' },
    { id: 'factures-non-parvenues', label: 'Factures non parvenues', icon: 'file-minus' },
    { id: 'regularisations', label: 'Régularisations périodiques', icon: 'rotate-ccw' },
    { id: 'creances-douteuses', label: 'Créances douteuses', icon: 'alert-circle' }
  ],
  declaratif: [
    { id: 'tva-declarations', label: 'Déclarations TVA', icon: 'file' },
    { id: 'tva-infos', label: 'Informations TVA', icon: 'info' },
    { id: 'tva-teledeclaration', label: 'Télédéclarations TVA', icon: 'upload' },
    { divider: true },
    { id: 'is-declarations', label: 'Déclarations IS', icon: 'file' },
    { id: 'is-teledeclaration', label: 'Télédéclarations IS', icon: 'upload' },
    { divider: true },
    { id: 'das2-declarations', label: 'Déclarations DAS2', icon: 'file' },
    { id: 'das2-teledeclaration', label: 'Télédéclarations DAS2', icon: 'upload' },
    { divider: true },
    { id: 'fec', label: 'Fichier des écritures comptables', icon: 'database' }
  ],
  cloture: [
    { id: 'gestion-journaux', label: 'Gestion des journaux', icon: 'book' },
    { id: 'gestion-exercices', label: 'Gestion des exercices', icon: 'calendar' },
    { id: 'reevaluation', label: 'Réévaluation devises', icon: 'dollar-sign' },
    { id: 'export-liasses', label: 'Export liasses EBP', icon: 'download' },
    { id: 'generer-regularisations', label: 'Générer régularisations', icon: 'file-plus' },
    { id: 'extourner', label: 'Extourner opérations', icon: 'rotate-ccw' }
  ]
};

// ─────────────────────────────────────────────
// GESTION DES ONGLETS PRINCIPAUX (header nav)
// ─────────────────────────────────────────────
const mainNavLinks = document.querySelectorAll('.main-nav a');
const subtabSidebarList = document.getElementById('subtab-sidebar-list');
const currentMainTabLabel = document.getElementById('current-main-tab-label');
const contentPane = document.getElementById('contentPane');

let currentMainTab = 'quotidien';
let currentSubTab = 'saisie-journal';

// Active un onglet principal
function activateMainTab(tabId) {
  // Mise à jour classe active dans la nav
  mainNavLinks.forEach(link => {
    if (link.dataset.tab === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  currentMainTab = tabId;
  // Met à jour le titre dans la sidebar
  currentMainTabLabel.textContent = 
    tabId.charAt(0).toUpperCase() + tabId.slice(1); // Quotidien, Trésorerie, etc.

  // Affiche les sous‑onglets correspondants dans la sidebar
  renderSubTabsInSidebar(tabId);
}

// Affiche la liste des sous‑onglets dans la sidebar
function renderSubTabsInSidebar(tabId) {
  const subs = subTabsDefinition[tabId];
  if (!subs) return;

  subtabSidebarList.innerHTML = '';

  subs.forEach((item, index) => {
    if (item.divider) {
      const divider = document.createElement('div');
      divider.className = 'subtab-divider';
      subtabSidebarList.appendChild(divider);
    } else {
      const link = document.createElement('a');
      link.href = '#';
      link.className = 'subtab-link';
      if (index === 0 && !currentSubTab) {
        link.classList.add('active');
        currentSubTab = item.id;
      }
      link.innerHTML = `<i data-lucide="${item.icon}"></i> ${item.label}`;
      link.dataset.subtab = item.id;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activateSubTab(item.id);
      });
      subtabSidebarList.appendChild(link);
    }
  });

  // Si aucun sous‑onglet actif, prendre le premier
  const firstSub = subs.find(s => !s.divider);
  if (firstSub && !currentSubTab) {
    currentSubTab = firstSub.id;
  }

  // Marquer le sous‑onglet actif
  document.querySelectorAll('.subtab-link').forEach(link => {
    if (link.dataset.subtab === currentSubTab) {
      link.classList.add('active');
    }
  });

  lucide.createIcons();
  loadSubTabContent(currentSubTab);
}

// Active un sous‑onglet (depuis la sidebar)
function activateSubTab(subtabId) {
  currentSubTab = subtabId;
  // Retire la classe active de tous les sous‑onglets
  document.querySelectorAll('.subtab-link').forEach(link => {
    link.classList.remove('active');
  });
  // Ajoute la classe active sur l'élément correspondant
  const activeLink = Array.from(document.querySelectorAll('.subtab-link')).find(
    link => link.dataset.subtab === subtabId
  );
  if (activeLink) activeLink.classList.add('active');

  loadSubTabContent(subtabId);
}

// Charge le contenu du sous‑onglet
function loadSubTabContent(subtabId) {
  let content = '';

  switch (subtabId) {
    case 'saisie-journal':
      content = renderEcrituresTable();
      break;
    case 'echeancier-client':
      content = renderEcheancesTable();
      break;
    case 'relances':
      content = renderRelancesTable();
      break;
    default:
      content = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <i data-lucide="file-text" style="width:48px;height:48px;margin-bottom:1rem;"></i>
          <h3>Module "${subtabId}" en cours de développement</h3>
          <p>Les données seront chargées depuis Supabase.</p>
        </div>
      `;
  }

  contentPane.innerHTML = content;
  lucide.createIcons();
}

// ─────────────────────────────────────────────
// RENDU DES TABLEAUX (mock / Supabase)
// ─────────────────────────────────────────────
function renderEcrituresTable() {
  if (!ecritures.length) ecritures = generateMockEcritures();
  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h3 style="font-size:1.1rem; font-weight:600;">Journal des écritures</h3>
      <button class="btn-primary" style="display:flex; align-items:center; gap:0.3rem;">
        <i data-lucide="plus"></i> Nouvelle écriture
      </button>
    </div>
    <table class="data-table">
      <thead>
        <tr><th>Date</th><th>Compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th></tr>
      </thead>
      <tbody>
  `;
  ecritures.slice(0, 8).forEach(e => {
    html += `<tr>
      <td>${e.date_ecriture || '06/02/2026'}</td>
      <td>${e.compte || '411000'}</td>
      <td>${e.libelle || 'Vente client'}</td>
      <td>${e.debit ? e.debit.toFixed(2) + ' €' : ''}</td>
      <td>${e.credit ? e.credit.toFixed(2) + ' €' : ''}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  return html;
}

function renderEcheancesTable() {
  if (!echeances.length) echeances = generateMockEcheances();
  let html = `
    <h3 style="font-size:1.1rem; font-weight:600; margin-bottom:1.5rem;">Échéances clients à venir</h3>
    <table class="data-table">
      <thead><tr><th>Client</th><th>Date échéance</th><th>Montant</th><th>Statut</th></tr></thead>
      <tbody>
  `;
  echeances.forEach(e => {
    const statusClass = e.statut === 'payé' ? 'badge-success' : (e.statut === 'en retard' ? 'badge-danger' : 'badge-warning');
    html += `<tr>
      <td>${e.client || 'Client A'}</td>
      <td>${e.date_echeance}</td>
      <td>${e.montant} €</td>
      <td><span class="badge ${statusClass}">${e.statut}</span></td>
    </tr>`;
  });
  html += '</tbody></table>';
  return html;
}

function renderRelancesTable() {
  let rel = generateMockRelances();
  let html = `
    <h3 style="font-size:1.1rem; font-weight:600; margin-bottom:1.5rem;">Relances à effectuer</h3>
    <table class="data-table">
      <thead><tr><th>Client</th><th>Échéance</th><th>Montant</th><th>Action</th></tr></thead>
      <tbody>
  `;
  rel.forEach(r => {
    html += `<tr>
      <td>${r.client}</td>
      <td>${r.date_echeance}</td>
      <td>${r.montant} €</td>
      <td><span class="badge badge-warning">À relancer</span></td>
    </tr>`;
  });
  html += '</tbody></table>';
  return html;
}

// ─────────────────────────────────────────────
// DONNÉES MOCK
// ─────────────────────────────────────────────
function generateMockEcritures() {
  return [
    { date_ecriture: '2026-02-06', compte: '411000', libelle: 'Vente SARL Dupont', debit: 1250.00 },
    { date_ecriture: '2026-02-06', compte: '512000', libelle: 'Règlement client', credit: 1250.00 },
    { date_ecriture: '2026-02-05', compte: '606300', libelle: 'Achat fournitures', debit: 340.50 },
    { date_ecriture: '2026-02-05', compte: '401000', libelle: 'Facture fournisseur', credit: 340.50 },
    { date_ecriture: '2026-02-04', compte: '706000', libelle: 'Prestations services', debit: 890.00 },
  ];
}

function generateMockEcheances() {
  return [
    { client: 'SARL Martin', date_echeance: '2026-02-15', montant: 3450.00, statut: 'à venir' },
    { client: 'SAS Bâtiment', date_echeance: '2026-02-10', montant: 1275.50, statut: 'en retard' },
    { client: 'Mairie de Lyon', date_echeance: '2026-02-20', montant: 8900.00, statut: 'à venir' },
    { client: 'Auto École Pilote', date_echeance: '2026-02-08', montant: 620.00, statut: 'payé' },
  ];
}

function generateMockRelances() {
  return [
    { client: 'SAS Bâtiment', date_echeance: '2026-01-30', montant: 1275.50 },
    { client: 'Boulangerie Moderne', date_echeance: '2026-01-25', montant: 430.00 },
  ];
}

// ─────────────────────────────────────────────
// ÉCOUTEURS & INIT
// ─────────────────────────────────────────────
mainNavLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    activateMainTab(link.dataset.tab);
  });
});

// Activation initiale
activateMainTab('quotidien');

// Chargement des données
loadData();

// Rafraîchissement périodique des icônes Lucide
setInterval(() => lucide.createIcons(), 200);