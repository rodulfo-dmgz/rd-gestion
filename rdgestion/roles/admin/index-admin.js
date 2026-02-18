/* ===============================
   DASHBOARD - Navigation & KPIs dynamiques AVEC SUPABASE
   Version finale avec diagnostic optionnel
   =============================== */

// ==================== SESSION ====================
const session = JSON.parse(localStorage.getItem("session"));
if (!session || !session.user) {
  window.location.href = "../../index.html";
  throw new Error("Utilisateur non connecté");
}

const user = session.user;
const tenantId = session.tenant.id;
const tenantRaisonSociale = session.tenant.raison_sociale || "CRM";

console.log("🔍 Tenant ID :", tenantId);

// Mode diagnostic (désactiver le filtre tenant pour tester)
const IGNORE_TENANT_FILTER = localStorage.getItem("debug_ignore_tenant") === "true";
if (IGNORE_TENANT_FILTER) {
  console.warn("⚠️ Mode diagnostic : le filtre tenant_id est ignoré !");
}

// ==================== CLIENT SUPABASE ====================
const supabaseClient = window.CRM.getSupabaseClient();

// ==================== AFFICHAGE EN-TÊTE ====================
document.getElementById("welcome").innerText = `Bonjour ${user.prenom} ${user.nom}`;
document.getElementById("user-info").innerText = user.fonction || user.role_tenant || user.service;
document.getElementById("company-name").innerText = tenantRaisonSociale;
document.getElementById("tenant-context").innerText = `Vous êtes connecté sur la base de données de : ${tenantRaisonSociale}`;

if (typeof lucide !== 'undefined') lucide.createIcons();

// ==================== GESTION DES PERMISSIONS ====================
function getAccessibleModules(user) {
  const serviceModules = {
    "admin":    ["clients", "produits", "ventes", "planning", "SIRH", "comptabilite", "factures", "statistiques"],
    "Direction":["clients", "produits", "ventes", "planning", "SIRH", "comptabilite", "factures", "statistiques"],
    "GP":       ["SIRH", "planning"],
    "ARH":      ["SIRH", "planning"],
    "GCF":      ["comptabilite", "factures", "statistiques"],
    "CA":       ["clients", "ventes", "factures"],
    "AC":       ["clients", "ventes", "planning"],
    "SA":       ["clients", "planning"],
    "SC":       ["ventes", "factures"],
    "AD":       ["clients", "planning"]
  };
  return serviceModules[user.service] || serviceModules["Direction"];
}

function hasAccessToModule(user, module) {
  return getAccessibleModules(user).includes(module);
}

// ==================== NAVIGATION ====================
function generateNavigation() {
  const nav = document.getElementById("sidebar-nav");
  if (!nav) return;
  nav.innerHTML = "";

  const modules = getAccessibleModules(user);
  const moduleLinks = {
    "clients":       { url: "../clients.html",        label: "Clients",          icon: "users" },
    "produits":      { url: "../produits.html",       label: "Produits",         icon: "package" },
    "ventes":        { url: "../ventes.html",         label: "Ventes",           icon: "euro" },
    "planning":      { url: "../planning.html",       label: "Planning",         icon: "calendar" },
    "SIRH":          { url: "../../roles/5_ARH/index-arh.html", label: "Gestion salariés", icon: "briefcase" },
    "comptabilite":  { url: "../comptabilite.html",   label: "Comptabilité",     icon: "book-open" },
    "factures":      { url: "../factures.html",       label: "Factures",         icon: "file-text" },
    "statistiques":  { url: "../statistiques.html",   label: "Statistiques",     icon: "bar-chart-2" }
  };

  modules.forEach(module => {
    if (moduleLinks[module]) {
      const link = document.createElement("a");
      link.href = moduleLinks[module].url;
      link.innerHTML = `<i data-lucide="${moduleLinks[module].icon}"></i> ${moduleLinks[module].label}`;
      nav.appendChild(link);
    }
  });

  const dashboardLink = document.createElement("a");
  dashboardLink.href = "index-admin.html";
  dashboardLink.innerHTML = '<i data-lucide="layout-dashboard"></i> Dashboard';
  dashboardLink.classList.add("active");
  nav.insertBefore(dashboardLink, nav.firstChild);

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==================== LISTE DES TABLES AVEC TENANT_ID ====================
const tablesWithTenant = [
  'clients', 'fournisseurs', 'factures_vente', 'factures_achat',
  'produits_services', 'devis', 'commandes_vente', 'commandes_achat',
  'prospects', 'opportunites', 'contacts', 'reglements_clients',
  'reglements_fournisseurs', 'parametres_globaux', 'exercices_comptables',
  'plan_comptable', 'journaux', 'tva_taux', 'modes_reglement', 'banques',
  'categories_produits', 'planning', 'transactions'
];

// ==================== GÉNÉRATION DES KPI (AVEC DIAGNOSTIC) ====================
async function generateKPIs() {
  const kpiGrid = document.getElementById("kpi-grid");
  if (!kpiGrid) return;
  kpiGrid.innerHTML = "";

  // Définition des KPI (la table "tickets" a été retirée car inexistante)
  const kpiDefinitions = [
    { label: "Clients actifs",      source: "clients",          filter: { actif: true }, type: "count", field: "id" },
    { label: "Prospects",           source: "prospects",        filter: {}, type: "count", field: "id" },
    { label: "Fournisseurs actifs", source: "fournisseurs",     filter: { actif: true }, type: "count", field: "id" },
    { label: "Produits/Services",   source: "produits_services",filter: { actif: true }, type: "count", field: "id" },
    { label: "Factures de vente",   source: "factures_vente",   filter: {}, type: "count", field: "id" },
    { label: "Factures impayées",   source: "factures_vente",   filter: { statut: "impayée" }, type: "count", field: "id" },
    { label: "CA total (HT)",        source: "factures_vente",   type: "sum", field: "montant_ht", filter: { statut: "validée" } },
    { label: "CA du mois (HT)",      source: "factures_vente",   type: "sum-month", field: "montant_ht", dateField: "date_facture", filter: { statut: "validée" } },
    { label: "Devis en cours",      source: "devis",            filter: { statut: "brouillon" }, type: "count", field: "id" },
    { label: "Commandes fournisseurs", source: "commandes_achat", filter: {}, type: "count", field: "id" },
    { label: "TVA collectée (mois)", source: "factures_vente",   type: "sum-month", field: "montant_tva", dateField: "date_facture", filter: { statut: "validée" } },
    { label: "Règlements clients (mois)", source: "reglements_clients", type: "sum-month", field: "montant", dateField: "date_reglement" }
  ];

  for (const def of kpiDefinitions) {
    const kpiElement = document.createElement("article");
    kpiElement.className = "kpi";

    console.log(`🔍 Chargement KPI: ${def.label} (${def.source})`);
    const result = await calculateKPIValue(def.source, def.type, def.field, def.filter, def.dateField);
    console.log(`✅ ${def.label} = ${result.value} ${result.diagnostic ? '(' + result.diagnostic + ')' : ''}`);

    kpiElement.innerHTML = `
      <span class="kpi-label">${def.label}</span>
      <span class="kpi-value" id="${def.source}-${def.type}">${result.value}</span>
    `;
    kpiGrid.appendChild(kpiElement);
  }
}

/**
 * Calcule la valeur d'un KPI avec gestion du tenant et diagnostic optionnel.
 * Retourne un objet { value, diagnostic }.
 */
async function calculateKPIValue(source, type, field = 'id', filter = {}, dateField = null) {
  try {
    let query = supabaseClient.from(source).select('*', { count: 'exact', head: false });

    // Filtre tenant (sauf mode diagnostic)
    if (!IGNORE_TENANT_FILTER && tablesWithTenant.includes(source) && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    // Appliquer les filtres simples (hors filtres spéciaux comme 'date')
    Object.keys(filter).forEach(key => {
      if (key !== 'date') query = query.eq(key, filter[key]);
    });

    const { data, error, count } = await query;

    if (error) {
      // Table inexistante
      if (error.code === 'PGRST116' || error.message?.includes('Could not find')) {
        console.warn(`⚠️ Table ${source} n'existe pas dans Supabase.`);
        return { value: "—", diagnostic: "table inexistante" };
      }
      console.warn(`⚠️ Table ${source} inaccessible:`, error.message);
      return { value: "—", diagnostic: error.message };
    }

    // Diagnostic : si aucun résultat avec tenant, compter globalement
    let diagnostic = null;
    if ((!data || data.length === 0) && tablesWithTenant.includes(source) && tenantId && !IGNORE_TENANT_FILTER) {
      const { count: globalCount, error: globalError } = await supabaseClient
        .from(source)
        .select('*', { count: 'exact', head: true });
      if (!globalError && globalCount !== null) {
        diagnostic = `${globalCount} enr. total (aucun avec ce tenant)`;
      } else {
        diagnostic = "impossible de compter globalement";
      }
    }

    if (!data || data.length === 0) {
      return { value: "0" + (type.includes('sum') ? " €" : ""), diagnostic };
    }

    // Calcul selon le type
    switch(type) {
      case "sum": {
        const total = data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
        return { value: total.toFixed(2) + " €", diagnostic };
      }
      case "sum-month": {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const dateFieldName = dateField || 'date';
        const filtered = data.filter(item => {
          const dateValue = item[dateFieldName];
          if (!dateValue) return false;
          const d = new Date(dateValue);
          return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
        });
        const total = filtered.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
        return { value: total.toFixed(2) + " €", diagnostic };
      }
      case "count":
      default:
        return { value: (count !== null ? count : data.length).toString(), diagnostic };
    }
  } catch (err) {
    console.error(`❌ Erreur chargement ${source}:`, err);
    return { value: "—", diagnostic: err.message };
  }
}

// ==================== GRAPHIQUES ====================
async function generateCharts() {
  const chartsGrid = document.getElementById("charts-grid");
  if (!chartsGrid) return;
  chartsGrid.innerHTML = "";

  if (hasAccessToModule(user, "ventes") || hasAccessToModule(user, "produits")) {
    const chartCard = document.createElement("div");
    chartCard.className = "chart-card";
    chartCard.innerHTML = `
      <h3>Ventes par produit (simulé)</h3>
      <canvas id="barChart"></canvas>
    `;
    chartsGrid.appendChild(chartCard);

    try {
      let query = supabaseClient.from('produits_services').select('*');
      if (!IGNORE_TENANT_FILTER && tenantId) query = query.eq('tenant_id', tenantId);
      const { data: produits, error } = await query;

      if (!error && produits?.length) {
        const palette = ['#1F4590', '#1BA098', '#FF570A', '#D72638', '#94A3B8', '#5A4BA5','#A54B69'];
        new Chart(document.getElementById('barChart'), {
          type: 'bar',
          data: {
            labels: produits.map(p => p.libelle || p.nom).slice(0,7),
            datasets: [{
              label: 'Ventes (simulé)',
              data: produits.map(() => Math.floor(Math.random() * 100)).slice(0,7),
              backgroundColor: produits.map((_, i) => palette[i % palette.length]),
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      } else {
        chartCard.innerHTML += '<p style="text-align:center; color: var(--text-muted); padding: 2rem;">Aucune donnée</p>';
      }
    } catch (err) {
      console.error('❌ Erreur graphique produits:', err);
    }
  }

  if (hasAccessToModule(user, "clients")) {
    const mapCard = document.createElement("div");
    mapCard.className = "chart-card";
    mapCard.innerHTML = `
      <h3>Clients par ville</h3>
      <div id="map"></div>
    `;
    chartsGrid.appendChild(mapCard);
    setTimeout(() => loadMap(), 100);
  }
}

async function loadMap() {
  try {
    let query = supabaseClient.from('clients').select('*');
    if (!IGNORE_TENANT_FILTER && tenantId) query = query.eq('tenant_id', tenantId);
    const { data: clients, error } = await query;
    if (error || !clients?.length) return;
    if (typeof L === 'undefined') return;

    const map = L.map('map').setView([46.8, 2.4], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '' }).addTo(map);

    for (const c of clients) {
      if (c.ville) {
        const coords = await geocodeCity(c.ville);
        if (coords) {
          L.circleMarker(coords, {
            radius: 6,
            fillColor: '#1F4590',
            color: '#12355b',
            weight: 1,
            fillOpacity: 0.7
          }).addTo(map).bindPopup(`<b>${c.raison_sociale || c.nom}</b><br>${c.ville}`);
        }
      }
    }
    map.invalidateSize();
  } catch (err) {
    console.error('❌ Erreur chargement carte:', err);
  }
}

async function geocodeCity(cityName) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.length) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (err) {}
  return null;
}

// ==================== TABLEAUX ====================
async function generateTables() {
  const tablesGrid = document.getElementById("tables-grid");
  if (!tablesGrid) return;
  tablesGrid.innerHTML = "";

  if (hasAccessToModule(user, "ventes") || hasAccessToModule(user, "comptabilite")) {
    const tableCard = document.createElement("div");
    tableCard.className = "table-card";
    tableCard.innerHTML = `
      <h3>Dernières factures</h3>
      <table id="transactions">
        <thead>
          <tr><th>N° facture</th><th>Client</th><th>Montant TTC</th><th>Date</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    tablesGrid.appendChild(tableCard);

    try {
      let query = supabaseClient
        .from('factures_vente')
        .select(`
          code_facture,
          montant_ttc,
          date_facture,
          clients ( raison_sociale )
        `);
      if (!IGNORE_TENANT_FILTER && tenantId) query = query.eq('tenant_id', tenantId);
      query = query.order('date_facture', { ascending: false }).limit(5);

      const { data: factures, error } = await query;
      const tbody = tableCard.querySelector("tbody");
      if (!error && factures?.length) {
        factures.forEach(f => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${f.code_facture}</td>
            <td>${f.clients?.raison_sociale || 'Inconnu'}</td>
            <td>${f.montant_ttc} €</td>
            <td>${new Date(f.date_facture).toLocaleDateString('fr-FR')}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucune facture récente</td></tr>';
      }
    } catch (err) {
      console.error('❌ Erreur chargement factures:', err);
    }
  }

  // Tickets support supprimé car table inexistante
  // Vous pouvez ajouter d'autres tableaux ici si nécessaire
}

// ==================== TABLEAUX ====================
async function generateTables() {
  const tablesGrid = document.getElementById("tables-grid");
  if (!tablesGrid) return;
  tablesGrid.innerHTML = "";

  if (hasAccessToModule(user, "ventes") || hasAccessToModule(user, "comptabilite")) {
    const tableCard = document.createElement("div");
    tableCard.className = "table-card";
    tableCard.innerHTML = `
      <h3>Dernières factures</h3>
      <table id="recent-factures">
        <thead>
          <tr><th>N° facture</th><th>Client</th><th>Montant TTC</th><th>Date</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    tablesGrid.appendChild(tableCard);

    try {
      let query = supabaseClient
        .from('factures_vente')
        .select(`
          code_facture,
          montant_ttc,
          date_facture,
          clients ( raison_sociale )
        `);
      if (!IGNORE_TENANT_FILTER && tenantId) query = query.eq('tenant_id', tenantId);
      query = query.order('date_facture', { ascending: false }).limit(5);

      const { data: factures, error } = await query;
      const tbody = tableCard.querySelector("tbody");
      if (!error && factures?.length) {
        factures.forEach(f => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${f.code_facture}</td>
            <td>${f.clients?.raison_sociale || 'Inconnu'}</td>
            <td>${f.montant_ttc} €</td>
            <td>${new Date(f.date_facture).toLocaleDateString('fr-FR')}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucune facture récente</td></tr>';
      }
    } catch (err) {
      console.error('❌ Erreur chargement factures:', err);
    }
  }

  // Tickets support supprimé car table inexistante
  // Vous pouvez ajouter d'autres tableaux ici si nécessaire
}

// ==================== DÉCONNEXION ====================
document.getElementById("logout").onclick = () => {
  localStorage.removeItem("session");
  window.location.href = "../../index.html";
};

// ==================== INITIALISATION ====================
async function initDashboard() {
  console.log('🚀 Initialisation du dashboard...');
  if (!supabaseClient) {
    console.error('❌ Client Supabase non disponible !');
    alert('Erreur: Connexion à la base de données impossible');
    return;
  }
  try {
    generateNavigation();
    await generateKPIs();
    await generateCharts();
    await generateTables();
    console.log('✅ Dashboard initialisé');
  } catch (err) {
    console.error('❌ Erreur initialisation dashboard:', err);
  }
}

initDashboard();