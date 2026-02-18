/* ===============================
   DASHBOARD - Navigation & KPIs dynamiques
   =============================== */

// Vérification de connexion
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  window.location.href = "index.html";
}

/* ===============================
   AFFICHAGE INFO UTILISATEUR
   =============================== */
document.getElementById("welcome").innerText = `Bonjour ${user.prenom}`;
document.getElementById("user-info").innerText = user.role;

// Subtitle personnalisé selon service
document.getElementById("welcome").innerText = `Bonjour ${user.prenom}`;
document.getElementById("user-info").innerText = user.role;

// 👈 Ajouter cette ligne juste après
lucide.createIcons();

/* ===============================
   GÉNÉRATION NAVIGATION CONDITIONNELLE
   =============================== */
function generateNavigation() {
  const nav = document.getElementById("sidebar-nav");
  const modules = getAccessibleModules(user);
  
  // Mapping modules vers liens HTML
  const moduleLinks = {
    "clients":       { url: "modules/clients.html",        label: "Clients",          icon: "users" },
    "produits":      { url: "modules/produits.html",       label: "Produits",         icon: "package" },
    "ventes":        { url: "modules/ventes.html",         label: "Ventes",           icon: "euro" },
    "planning":      { url: "modules/planning.html",       label: "Planning",         icon: "calendar" },
    "SIRH":          { url: "modules/arh-employes.html",   label: "Gestion salariés", icon: "briefcase" },
    "comptabilite":  { url: "modules/comptabilite.html",   label: "Comptabilité",     icon: "book-open" },
    "factures":      { url: "modules/factures.html",       label: "Factures",         icon: "file-text" },
    "statistiques":  { url: "modules/statistiques.html",   label: "Statistiques",     icon: "bar-chart-2" }
  };
  
  // Créer les liens de navigation
  modules.forEach(module => {
    if (moduleLinks[module]) {
      const link = document.createElement("a");
      link.href = moduleLinks[module].url;
      link.innerHTML = `<i data-lucide="${moduleLinks[module].icon}"></i> ${moduleLinks[module].label}`;
      nav.appendChild(link);
    }
  });
  
  // Ajouter un lien vers le dashboard (toujours visible)
  const dashboardLink = document.createElement("a");
  dashboardLink.href = "dashboard.html";
  dashboardLink.innerHTML = '<i data-lucide="layout-dashboard"></i> Dashboard';
  dashboardLink.classList.add("active");
  nav.insertBefore(dashboardLink, nav.firstChild);

  // Convertir les <i data-lucide> en SVG
  lucide.createIcons();
}

/* ===============================
   GÉNÉRATION KPIs SELON SERVICE
   =============================== */
async function generateKPIs() {
  const kpiGrid = document.getElementById("kpi-grid");
  kpiGrid.innerHTML = ""; // Reset
  
  // KPIs selon le service
  const serviceKPIs = {
    "Direction": [
      { label: "Clients actifs", id: "kpi-clients", source: "clients" },
      { label: "CA du mois", id: "kpi-ca", source: "ventes", type: "sum" },
      { label: "Produits en rupture", id: "kpi-stock", source: "produits", type: "lowstock" },
      { label: "RDV aujourd'hui", id: "kpi-planning", source: "planning", type: "today" }
    ],
    "GP": [
      { label: "Salariés actifs", id: "kpi-employes", source: "employes" },
      { label: "Paies à traiter", id: "kpi-paies", value: "0" },
      { label: "RDV aujourd'hui", id: "kpi-planning", source: "planning", type: "today" }
    ],
    "ARH": [
      { label: "Salariés actifs", id: "kpi-employes", source: "employes" },
      { label: "RDV aujourd'hui", id: "kpi-planning", source: "planning", type: "today" },
      { label: "Formations en cours", id: "kpi-formations", value: "0" }
    ],
    "GCF": [
      { label: "CA du mois", id: "kpi-ca", source: "ventes", type: "sum" },
      { label: "Factures impayées", id: "kpi-factures", value: "0" },
      { label: "Trésorerie", id: "kpi-tresorerie", value: "0 €" }
    ],
    "CA": [
      { label: "Factures en attente", id: "kpi-factures", value: "0" },
      { label: "Paiements du mois", id: "kpi-paiements", value: "0 €" }
    ],
    "AC": [
      { label: "Clients actifs", id: "kpi-clients", source: "clients" },
      { label: "Ventes du mois", id: "kpi-ventes", source: "ventes" },
      { label: "RDV aujourd'hui", id: "kpi-planning", source: "planning", type: "today" }
    ],
    "SA": [
      { label: "RDV aujourd'hui", id: "kpi-planning", source: "planning", type: "today" },
      { label: "Clients actifs", id: "kpi-clients", source: "clients" },
      { label: "Courrier en attente", id: "kpi-courrier", value: "0" }
    ],
    "SC": [
      { label: "Factures à traiter", id: "kpi-factures", value: "0" },
      { label: "Paiements du mois", id: "kpi-paiements", value: "0 €" }
    ],
    "AD": [
      { label: "RDV aujourd'hui", id: "kpi-planning", source: "planning", type: "today" },
      { label: "Clients actifs", id: "kpi-clients", source: "clients" },
      { label: "Tâches en cours", id: "kpi-taches", value: "0" }
    ]
  };
  
  // Récupérer les KPIs du service ou Direction par défaut
  const kpis = serviceKPIs[user.service] || serviceKPIs["Direction"];
  
  // Générer chaque KPI
  for (const kpi of kpis) {
    const kpiElement = document.createElement("article");
    kpiElement.className = "kpi";
    
    let value = kpi.value || "—";
    
    // Calculer la valeur selon la source
    if (kpi.source) {
      value = await calculateKPIValue(kpi.source, kpi.type);
    }
    
    kpiElement.innerHTML = `
      <span class="kpi-label">${kpi.label}</span>
      <span class="kpi-value ${kpi.accent ? 'accent' : ''}" id="${kpi.id}">${value}</span>
    `;
    
    kpiGrid.appendChild(kpiElement);
  }
}

/* ===============================
   CALCULER VALEUR KPI
   =============================== */
async function calculateKPIValue(source, type) {
  try {
    const data = await loadJSON(`data/${source}.json`);
    
    switch(type) {
      case "sum":
        return data.reduce((sum, item) => sum + (item.montant || 0), 0).toFixed(2) + " €";
      
      case "lowstock":
        return data.filter(p => p.stock <= 5).length;
      
      case "today":
        const today = new Date().toISOString().slice(0, 10);
        return Array.isArray(data) 
          ? data.filter(event => event.start_date === today).length 
          : 0;
      
      default:
        return data.length;
    }
  } catch (err) {
    console.error(`Erreur chargement ${source}:`, err);
    return "—";
  }
}

/* ===============================
   CHARGER JSON
   =============================== */
async function loadJSON(path) {
  const res = await fetch(path);
  return await res.json();
}

/* ===============================
   GÉNÉRER GRAPHIQUES
   =============================== */
async function generateCharts() {
  const chartsGrid = document.getElementById("charts-grid");
  chartsGrid.innerHTML = "";
  
  // Graphiques selon permissions
  if (hasAccessToModule(user, "ventes") || hasAccessToModule(user, "produits")) {
    // Graphique ventes par produit
    const chartCard = document.createElement("div");
    chartCard.className = "chart-card";
    chartCard.innerHTML = `
      <h3>Ventes par produit</h3>
      <canvas id="barChart"></canvas>
    `;
    chartsGrid.appendChild(chartCard);
    
    // Créer le graphique

    // Votre palette d'expert (Navy, Teal, Orange, Crimson, Slate)
const palette = ['#1F4590', '#1BA098', '#FF570A', '#D72638', '#94A3B8', '#5A4BA5','#A54B69'];
    const produits = await loadJSON("data/produits.json");
    new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: {
        labels: produits.map(p => p.nom),
        datasets: [{
          label: 'Ventes',
          data: produits.map(p => p.ventes),
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
  }
  
  // Carte clients
  if (hasAccessToModule(user, "clients")) {
    const mapCard = document.createElement("div");
    mapCard.className = "chart-card";
    mapCard.innerHTML = `
      <h3>Clients par ville</h3>
      <div id="map"></div>
    `;
    chartsGrid.appendChild(mapCard);
    
    // Initialiser la carte
    setTimeout(() => loadMap(), 100);
  }
}

/* ===============================
   CARTE CLIENTS
   =============================== */
async function loadMap() {
  const clients = await loadJSON("data/clients.json");
  
  const map = L.map('map').setView([46.8, 2.4], 5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: ''
  }).addTo(map);
  
  for (const c of clients) {
    const coords = await geocodeCity(c.ville);
    if (coords) {
      L.circleMarker(coords, {
        radius: 6,
        fillColor: '#1F4590',
        color: '#12355b',
        weight: 1,
        fillOpacity: 0.7
      })
      .addTo(map)
      .bindPopup(`<b>${c.nom}</b><br>${c.ville}, ${c.pays || ''}`);
    }
  }
  
  map.invalidateSize();
}

async function geocodeCity(cityName) {
  const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.length) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return null;
}

/* ===============================
   GÉNÉRER TABLES
   =============================== */
async function generateTables() {
  const tablesGrid = document.getElementById("tables-grid");
  tablesGrid.innerHTML = "";
  
  // Table transactions (si accès ventes ou comptabilité)
  if (hasAccessToModule(user, "ventes") || hasAccessToModule(user, "comptabilite")) {
    const tableCard = document.createElement("div");
    tableCard.className = "table-card";
    tableCard.innerHTML = `
      <h3>Transactions récentes</h3>
      <table id="transactions">
        <thead>
          <tr><th>ID</th><th>Client</th><th>Montant</th><th>Date</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    tablesGrid.appendChild(tableCard);
    
    // Charger transactions
    const transactions = await loadJSON("data/transactions.json");
    const tbody = tableCard.querySelector("tbody");
    transactions.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.id}</td>
        <td>${t.client}</td>
        <td>${t.montant} €</td>
        <td>${t.date}</td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  // Support tickets (toujours visible)
  const ticketsCard = document.createElement("div");
  ticketsCard.className = "table-card";
  ticketsCard.innerHTML = `
    <h3>Support tickets</h3>
    <ul id="tickets"></ul>
  `;
  tablesGrid.appendChild(ticketsCard);
  
  const tickets = await loadJSON("data/tickets.json");
  const ul = ticketsCard.querySelector("#tickets");
  tickets.forEach(ticket => {
    const li = document.createElement("li");
    li.innerText = `#${ticket.id} - ${ticket.sujet} (${ticket.status})`;
    ul.appendChild(li);
  });
}

/* ===============================
   CHARGER NOM ENTREPRISE
   =============================== */
fetch("data/entreprise.json")
  .then(r => r.json())
  .then(entreprise => {
    document.getElementById("company-name").innerText = entreprise.nom || "CRM";
  });

/* ===============================
   DÉCONNEXION
   =============================== */
document.getElementById("logout").onclick = () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
};

/* ===============================
   INITIALISATION DASHBOARD
   =============================== */
async function initDashboard() {
  generateNavigation();
  await generateKPIs();
  await generateCharts();
  await generateTables();
}

initDashboard();