/* ===============================
   DASHBOARD - Navigation & KPIs dynamiques AVEC SUPABASE
   =============================== */

const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  window.location.href = "index-admin.html";
}

/* ===============================
   AFFICHAGE INFO UTILISATEUR
   =============================== */
document.getElementById("welcome").innerText = `Bonjour ${user.prenom}`;
document.getElementById("user-info").innerText = user.role;

lucide.createIcons();

/* ===============================
   GÉNÉRATION NAVIGATION CONDITIONNELLE
   =============================== */
function generateNavigation() {
  const nav = document.getElementById("sidebar-nav");
  const modules = getAccessibleModules(user);
  
  const moduleLinks = {
    "clients":       { url: "modules/clients.html",        label: "Clients",          icon: "users" },
    "produits":      { url: "modules/produits.html",       label: "Produits",         icon: "package" },
    "ventes":        { url: "modules/ventes.html",         label: "Ventes",           icon: "euro" },
    "planning":      { url: "modules/planning.html",       label: "Planning",         icon: "calendar" },
    "SIRH":          { url: "roles/5_ARH/index-arh.html",   label: "Gestion salariés", icon: "briefcase" },
    "comptabilite":  { url: "modules/comptabilite.html",   label: "Comptabilité",     icon: "book-open" },
    "factures":      { url: "modules/factures.html",       label: "Factures",         icon: "file-text" },
    "statistiques":  { url: "modules/statistiques.html",   label: "Statistiques",     icon: "bar-chart-2" }
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
  dashboardLink.href = "dashboard.html";
  dashboardLink.innerHTML = '<i data-lucide="layout-dashboard"></i> Dashboard';
  dashboardLink.classList.add("active");
  nav.insertBefore(dashboardLink, nav.firstChild);

  lucide.createIcons();
}

/* ===============================
   GÉNÉRATION KPIs DEPUIS SUPABASE
   =============================== */
async function generateKPIs() {
  const kpiGrid = document.getElementById("kpi-grid");
  kpiGrid.innerHTML = "";
  
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
  
  const kpis = serviceKPIs[user.service] || serviceKPIs["Direction"];
  
  for (const kpi of kpis) {
    const kpiElement = document.createElement("article");
    kpiElement.className = "kpi";
    
    let value = kpi.value || "—";
    
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
   CALCULER VALEUR KPI DEPUIS SUPABASE
   =============================== */
async function calculateKPIValue(source, type) {
  try {
    const { data, error } = await supabase
      .from(source)
      .select('*');
    
    if (error) {
      console.warn(`⚠️ Table ${source} non trouvée ou vide:`, error.message);
      return "—";
    }
    
    // Vérifier si data existe et est un tableau
    if (!data || !Array.isArray(data)) {
      console.warn(`⚠️ Pas de données pour ${source}`);
      return "—";
    }
    
    switch(type) {
      case "sum":
        return data.reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0).toFixed(2) + " €";
      
      case "lowstock":
        return data.filter(p => p.stock <= 5).length;
      
      case "today":
        const today = new Date().toISOString().slice(0, 10);
        return data.filter(event => event.start_date === today).length;
      
      default:
        return data.length;
    }
  } catch (err) {
    console.error(`❌ Erreur chargement ${source}:`, err);
    return "—";
  }
}

/* ===============================
   GÉNÉRER GRAPHIQUES AVEC SUPABASE
   =============================== */
async function generateCharts() {
  const chartsGrid = document.getElementById("charts-grid");
  chartsGrid.innerHTML = "";
  
  if (hasAccessToModule(user, "ventes") || hasAccessToModule(user, "produits")) {
    const chartCard = document.createElement("div");
    chartCard.className = "chart-card";
    chartCard.innerHTML = `
      <h3>Ventes par produit</h3>
      <canvas id="barChart"></canvas>
    `;
    chartsGrid.appendChild(chartCard);
    
    try {
      // Charger produits depuis Supabase
      const { data: produits, error } = await supabase
        .from('produits')
        .select('*');
      
      if (!error && produits && produits.length > 0) {
        const palette = ['#1F4590', '#1BA098', '#FF570A', '#D72638', '#94A3B8', '#5A4BA5','#A54B69'];
        
        new Chart(document.getElementById('barChart'), {
          type: 'bar',
          data: {
            labels: produits.map(p => p.nom),
            datasets: [{
              label: 'Ventes',
              data: produits.map(p => p.ventes || 0),
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
        chartCard.innerHTML += '<p style="text-align:center; color: var(--text-muted); padding: 2rem;">Aucune donnée disponible</p>';
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

/* ===============================
   CARTE CLIENTS AVEC SUPABASE
   =============================== */
async function loadMap() {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) {
      console.warn("⚠️ Erreur chargement clients pour la carte:", error.message);
      return;
    }
    
    if (!clients || clients.length === 0) {
      console.warn("⚠️ Aucun client à afficher sur la carte");
      return;
    }
    
    const map = L.map('map').setView([46.8, 2.4], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: ''
    }).addTo(map);
    
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
          })
          .addTo(map)
          .bindPopup(`<b>${c.nom}</b><br>${c.ville}, ${c.pays || ''}`);
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
    if (data.length) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (err) {
    console.warn(`⚠️ Géocodage échoué pour ${cityName}`);
  }
  return null;
}

/* ===============================
   GÉNÉRER TABLES AVEC SUPABASE
   =============================== */
async function generateTables() {
  const tablesGrid = document.getElementById("tables-grid");
  tablesGrid.innerHTML = "";
  
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
    
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);
      
      if (!error && transactions && transactions.length > 0) {
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
      } else {
        tableCard.querySelector("tbody").innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Aucune transaction</td></tr>';
      }
    } catch (err) {
      console.error('❌ Erreur chargement transactions:', err);
    }
  }
  
  const ticketsCard = document.createElement("div");
  ticketsCard.className = "table-card";
  ticketsCard.innerHTML = `
    <h3>Support tickets</h3>
    <ul id="tickets"></ul>
  `;
  tablesGrid.appendChild(ticketsCard);
  
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && tickets && tickets.length > 0) {
      const ul = ticketsCard.querySelector("#tickets");
      tickets.forEach(ticket => {
        const li = document.createElement("li");
        li.innerText = `#${ticket.id} - ${ticket.sujet} (${ticket.status})`;
        ul.appendChild(li);
      });
    } else {
      ticketsCard.querySelector("#tickets").innerHTML = '<li style="color: var(--text-muted);">Aucun ticket</li>';
    }
  } catch (err) {
    console.error('❌ Erreur chargement tickets:', err);
  }
}

/* ===============================
   CHARGER NOM ENTREPRISE DEPUIS SUPABASE
   =============================== */
async function loadCompanyName() {
  try {
    const { data: entreprise, error } = await supabase
      .from('entreprise')
      .select('nom')
      .single();
    
    if (error) throw error;
    
    document.getElementById("company-name").innerText = entreprise.nom || "CRM";
  } catch (err) {
    console.error("⚠️ Erreur chargement entreprise:", err.message);
    document.getElementById("company-name").innerText = "CRM";
  }
}

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
  console.log('🚀 Initialisation du dashboard...');
  
  // Vérifier que Supabase est disponible
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase non disponible !');
    alert('Erreur: Connexion à la base de données impossible');
    return;
  }
  
  try {
    generateNavigation();
    await loadCompanyName();
    await generateKPIs();
    await generateCharts();
    await generateTables();
    
    console.log('✅ Dashboard initialisé avec succès');
  } catch (err) {
    console.error('❌ Erreur initialisation dashboard:', err);
  }
}

initDashboard();