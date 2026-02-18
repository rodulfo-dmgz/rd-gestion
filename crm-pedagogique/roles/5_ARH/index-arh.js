// =============================================
// DASHBOARD ARH - RESSOURCES HUMAINES
// =============================================

// Vérification utilisateur connecté
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  window.location.href = "../../index.html";
}

// Vérification des permissions ARH
if (user.service !== "ARH" && !user.acces_total) {
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

// Afficher la date du jour
const currentDate = new Date().toLocaleDateString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});
document.getElementById("current-date").textContent = currentDate;

// ─────────────────────────────────────────────
// NAVIGATION SIDEBAR
// ─────────────────────────────────────────────
function generateNavigation() {
  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = '';

  // Dashboard ARH (actif)
  const arhDashboard = document.createElement("a");
  arhDashboard.href = "index-arh.html";
  arhDashboard.innerHTML = '<i data-lucide="layout-grid"></i> Dashboard';
  arhDashboard.classList.add("active");
  nav.appendChild(arhDashboard);

  // Divider ARH
  const arhDivider = document.createElement("div");
  arhDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;";
  arhDivider.innerHTML = '<i data-lucide="users" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i> Module ARH';
  nav.appendChild(arhDivider);


  // Modules ARH
  const arhModules = [
    { url: "modules/employes.html", label: "Gestion Salariés", icon: "users" },
    { url: "modules/conges.html", label: "Congés", icon: "calendar" },
    { url: "modules/formations.html", label: "Formations", icon: "graduation-cap" },
    { url: "modules/contrats.html", label: "Contrats", icon: "file-text" }
  ];

  arhModules.forEach(mod => {
    const link = document.createElement("a");
    link.href = mod.url;
    link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
    nav.appendChild(link);
  });

  // Convertir les icônes lucide
  lucide.createIcons();
}

// ─────────────────────────────────────────────
// CHARGEMENT NOM ENTREPRISE
// ─────────────────────────────────────────────
fetch("../../data/entreprise.json")
  .then(r => r.json())
  .then(data => {
    document.getElementById("company-name").textContent = data.nom || "CRM";
  })
  .catch(err => console.error("Erreur chargement entreprise:", err));

generateNavigation();

// Icônes topbar
lucide.createIcons();

// ─────────────────────────────────────────────
// CHARGEMENT DONNÉES EMPLOYÉS
// ─────────────────────────────────────────────
let employes = [];

async function loadEmployes() {
  try {
    const response = await fetch("../../data/employes.json");
    employes = await response.json();
    
    // Ajouter statut aléatoire si absent
    employes = employes.map(e => ({
      ...e,
      statut: e.statut || (Math.random() > 0.1 ? "Actif" : "Congé")
    }));
    
    calculateStats();
    displayServiceDistribution();
    displayRecentActivities();
    
  } catch (err) {
    console.error("Erreur chargement employés:", err);
  }
}

// ─────────────────────────────────────────────
// CALCUL DES STATISTIQUES
// ─────────────────────────────────────────────
function calculateStats() {
  const total = employes.length;
  const actifs = employes.filter(e => e.statut === "Actif").length;
  const services = [...new Set(employes.map(e => e.service))].length;
  
  // Recrutements du mois
  const currentMonth = new Date().getMonth();
  const recrutements = employes.filter(e => {
    if (!e.date_embauche) return false;
    const embaucheMonth = new Date(e.date_embauche).getMonth();
    return embaucheMonth === currentMonth;
  }).length;
  
  // Animation des compteurs
  animateValue('stat-total', 0, total, 1000);
  animateValue('stat-actifs', 0, actifs, 1200);
  animateValue('stat-services', 0, services, 1400);
  animateValue('stat-recrutements', 0, recrutements, 1600);
}

// Animation des valeurs numériques
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      element.textContent = end;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// ─────────────────────────────────────────────
// RÉPARTITION PAR SERVICE
// ─────────────────────────────────────────────
function displayServiceDistribution() {
  const distribution = {};
  
  employes.forEach(e => {
    const service = e.service || 'Non défini';
    distribution[service] = (distribution[service] || 0) + 1;
  });
  
  const container = document.getElementById('service-distribution');
  container.innerHTML = '';
  
  // Couleurs pour les services
  const colors = [
    '#FF570A', '#12355B', '#10b981', '#f59e0b', 
    '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'
  ];
  
  Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([service, count], index) => {
      const percentage = ((count / employes.length) * 100).toFixed(1);
      const color = colors[index % colors.length];
      
      const item = document.createElement('div');
      item.style.cssText = 'margin-bottom: 1rem;';
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">${service}</span>
          <span style="font-size: 0.875rem; color: var(--text-muted);">${count} (${percentage}%)</span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
          <div style="width: ${percentage}%; height: 100%; background: ${color}; transition: width 0.5s ease;"></div>
        </div>
      `;
      container.appendChild(item);
    });
}

// ─────────────────────────────────────────────
// ACTIVITÉS RÉCENTES
// ─────────────────────────────────────────────
function displayRecentActivities() {
  const container = document.getElementById('activities-list');
  container.innerHTML = '';
  
  // Simuler des activités récentes
  const activities = [
    {
      icon: 'user-plus',
      title: 'Nouveau recrutement',
      description: `${employes[employes.length - 1]?.prenom} ${employes[employes.length - 1]?.nom} - ${employes[employes.length - 1]?.poste}`,
      time: 'Il y a 2 heures'
    },
    {
      icon: 'calendar',
      title: 'Demande de congé',
      description: 'En attente de validation',
      time: 'Il y a 5 heures'
    },
    {
      icon: 'graduation-cap',
      title: 'Formation planifiée',
      description: 'Management - 15 participants inscrits',
      time: 'Hier'
    },
    {
      icon: 'file-text',
      title: 'Contrat renouvelé',
      description: '3 contrats CDD renouvelés',
      time: 'Il y a 2 jours'
    },
    {
      icon: 'user-check',
      title: 'Période d\'essai validée',
      description: '2 collaborateurs confirmés',
      time: 'Il y a 3 jours'
    }
  ];
  
  activities.forEach(activity => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-icon">
        <i data-lucide="${activity.icon}"></i>
      </div>
      <div class="activity-content">
        <h4>${activity.title}</h4>
        <p>${activity.description}</p>
      </div>
      <span class="activity-time">${activity.time}</span>
    `;
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

// ─────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────
loadEmployes();

// Rafraîchir les icônes Lucide
setTimeout(() => {
  lucide.createIcons();
}, 100);

// ─────────────────────────────────────────────
// GESTION DES CONGÉS (si données disponibles)
// ─────────────────────────────────────────────
async function loadPendingLeaves() {
  try {
    const response = await fetch("../../data/conges.json");
    const conges = await response.json();
    
    const pending = conges.filter(c => c.statut === 'En attente');
    const container = document.getElementById('pending-leaves');
    
    if (pending.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Aucune demande en attente</p>';
      return;
    }
    
    container.innerHTML = '';
    pending.slice(0, 5).forEach(conge => {
      const employee = employes.find(e => e.id === conge.employe_id);
      const item = document.createElement('div');
      item.style.cssText = 'padding: 0.75rem; border-bottom: 1px solid var(--border-light); cursor: pointer;';
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">${employee?.prenom} ${employee?.nom}</p>
            <p style="font-size: 0.75rem; color: var(--text-muted);">${conge.type} - ${conge.date_debut} au ${conge.date_fin}</p>
          </div>
          <span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
            En attente
          </span>
        </div>
      `;
      item.onclick = () => window.location.href = 'modules/conges.html';
      container.appendChild(item);
    });
    
  } catch (err) {
    console.log("Données congés non disponibles");
  }
}

loadPendingLeaves();