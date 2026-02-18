// Vérification simple de connexion
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "../index.html";

// Afficher info utilisateur
document.getElementById("user-info").innerText = user.role;

// Déconnexion
document.getElementById("logout").onclick = () => {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
};

// ─────────────────────────────
// NAVIGATION CONDITIONNELLE
// ─────────────────────────────
function generateNavigation() {
  const nav = document.getElementById("sidebar-nav");
  const modules = getAccessibleModules(user);
  
  const moduleLinks = {
    "clients": { url: "clients.html", label: "Clients", icon: "👥" },
    "produits": { url: "produits.html", label: "Produits", icon: "📦" },
    "ventes": { url: "ventes.html", label: "Ventes", icon: "💰" },
    "planning": { url: "planning.html", label: "Planning", icon: "📅" },
    "employes": { url: "salaries.html", label: "Salariés", icon: "👔" },
    "paie": { url: "paie.html", label: "Paie", icon: "💵" },
    "comptabilite": { url: "comptabilite.html", label: "Comptabilité", icon: "📊" },
    "factures": { url: "factures.html", label: "Factures", icon: "🧾" },
    "statistiques": { url: "statistiques.html", label: "Statistiques", icon: "📈" }
  };
  
  // Dashboard toujours en premier
  const dashboardLink = document.createElement("a");
  dashboardLink.href = "../dashboard.html";
  dashboardLink.innerHTML = "🏠 Dashboard";
  nav.appendChild(dashboardLink);
  
  // Créer les liens de navigation
  modules.forEach(module => {
    if (moduleLinks[module]) {
      const link = document.createElement("a");
      link.href = moduleLinks[module].url;
      link.innerHTML = `${moduleLinks[module].icon} ${moduleLinks[module].label}`;
      
      // Marquer comme actif si c'est la page actuelle
      if (window.location.pathname.includes(moduleLinks[module].url)) {
        link.classList.add("active");
      }
      
      nav.appendChild(link);
    }
  });
}

// Charger le nom de l'entreprise
fetch("../data/entreprise.json")
  .then(r => r.json())
  .then(data => document.getElementById("company-name").innerText = data.nom || "CRM");

// Générer la navigation
generateNavigation();

// ─────────────────────────────
// HELPER
// ─────────────────────────────
async function loadJSON(path) {
  const res = await fetch(path);
  return await res.json();
}

// ─────────────────────────────
// CHARGER KPIs
// ─────────────────────────────
async function loadKPIs() {
  const clients = await loadJSON("../data/clients.json");
  const ventes = await loadJSON("../data/ventes.json");
  
  // Total clients
  document.getElementById("stat-clients").innerText = clients.length;
  
  // CA Total
  const totalCA = ventes.reduce((sum, v) => sum + (v.montant || 0), 0);
  document.getElementById("stat-ca").innerText = totalCA.toFixed(2) + " €";
  
  // Nombre de ventes
  document.getElementById("stat-ventes").innerText = ventes.length;
  
  // Croissance (simulation)
  document.getElementById("stat-growth").innerText = "+12.5%";
}

// ─────────────────────────────
// GRAPHIQUE: Évolution des ventes
// ─────────────────────────────
async function createSalesChart() {
  const ctx = document.getElementById('salesChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
      datasets: [{
        label: 'Ventes (€)',
        data: [12000, 19000, 15000, 22000, 25000, 28000],
        borderColor: 'rgb(255, 87, 10)',
        backgroundColor: 'rgba(255, 87, 10, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ─────────────────────────────
// GRAPHIQUE: Répartition par catégorie
// ─────────────────────────────
async function createCategoryChart() {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Électronique', 'Mobilier', 'Logiciels', 'Services'],
      datasets: [{
        data: [35, 25, 20, 20],
        backgroundColor: [
          'rgb(255, 87, 10)',
          'rgb(215, 38, 56)',
          'rgb(18, 53, 91)',
          'rgb(66, 0, 57)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// ─────────────────────────────
// GRAPHIQUE: Top Produits
// ─────────────────────────────
async function createProductsChart() {
  const produits = await loadJSON("../data/produits.json");
  
  const ctx = document.getElementById('productsChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: produits.map(p => p.nom),
      datasets: [{
        label: 'Ventes',
        data: produits.map(p => p.ventes || 0),
        backgroundColor: 'rgba(255, 87, 10, 0.8)',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ─────────────────────────────
// GRAPHIQUE: Performance mensuelle
// ─────────────────────────────
async function createMonthlyChart() {
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
      datasets: [
        {
          label: 'Objectif',
          data: [20000, 20000, 20000, 20000, 20000, 20000],
          backgroundColor: 'rgba(215, 38, 56, 0.3)',
          borderColor: 'rgb(215, 38, 56)',
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: 'Réalisé',
          data: [19000, 22000, 18000, 25000, 24000, 28000],
          backgroundColor: 'rgba(255, 87, 10, 0.8)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ─────────────────────────────
// INITIALISATION
// ─────────────────────────────
async function initStatistiques() {
  await loadKPIs();
  await createSalesChart();
  await createCategoryChart();
  await createProductsChart();
  await createMonthlyChart();
}

initStatistiques();
