// Vérification connexion
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "../index.html";

document.getElementById("user-info").innerText = user.role;
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
  };
  
  const dashboardLink = document.createElement("a");
  dashboardLink.href = "../dashboard.html";
  dashboardLink.innerHTML = '<i data-lucide="layout-dashboard"></i> Dashboard';
  nav.appendChild(dashboardLink);
  
// Ajouter modules ARH en premier pour ARH
  if (user.service === "ARH" || user.acces_total) {
    const arhDivider = document.createElement("div");
    arhDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase;";
    arhDivider.innerHTML = '<i data-lucide="clipboard-list" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;stroke:currentColor;"></i> Modules ARH';
    nav.appendChild(arhDivider);

      
    [
      { url: "arh-employes.html", label: "Gestion de salariés", icon: "idCardLanyard" },
      { url: "salaries.html",     label: "Salariés",            icon: "users" },
      { url: "arh-conges.html",   label: "Congés",              icon: "umbrella" },
      { url: "arh-formations.html", label: "Formations",        icon: "graduation-cap" }
    ].forEach(mod => {
      const link = document.createElement("a");
      link.href = mod.url;
      link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
      if (window.location.pathname.includes(mod.url)) link.classList.add("active");
      nav.appendChild(link);
    });
  }

  if (user.service === "GP" || user.acces_total) {
    const gpDivider = document.createElement("div");
    gpDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase;";
    gpDivider.innerHTML = '<i data-lucide="banknote" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;stroke:currentColor;"></i> Modules GP';
    nav.appendChild(gpDivider);
    
    const gpLink = document.createElement("a");
    gpLink.href = "gp-paie.html";
    gpLink.innerHTML = '<i data-lucide="euro"></i> Paie';
    nav.appendChild(gpLink);
  }

 // Convertir tous les <i data-lucide> en SVG
  lucide.createIcons();
}

fetch("../data/entreprise.json")
  .then(r => r.json())
  .then(data => document.getElementById("company-name").innerText = data.nom || "CRM");

generateNavigation();

// Données formations
let formations = [];

async function loadFormations() {
  try {
    const res = await fetch("../data/formations.json");
    formations = await res.json();
  } catch {
    // Données par défaut
    formations = [
      { id: 1, nom: "Leadership et Management", employe: "Rodulfo DOMINGUEZ", organisme: "HEC Paris", debut: "2026-02-01", duree: 35, statut: "En cours" },
      { id: 2, nom: "Paie et Gestion RH", employe: "Claire Martin", organisme: "CEGOS", debut: "2026-01-15", duree: 21, statut: "Terminé" },
      { id: 3, nom: "Excel Avancé", employe: "Thomas Dubois", organisme: "ENI", debut: "2026-03-10", duree: 14, statut: "Planifié" },
      { id: 4, nom: "Communication interpersonnelle", employe: "Sophie Bernard", organisme: "Dale Carnegie", debut: "2026-02-20", duree: 28, statut: "Planifié" }
    ];
  }
  
  calculateStats();
  renderFormations(formations);
}

function calculateStats() {
  const total = formations.length;
  const cours = formations.filter(f => f.statut === "En cours").length;
  const termine = formations.filter(f => f.statut === "Terminé").length;
  const heures = formations.reduce((sum, f) => sum + (f.duree || 0), 0);
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-cours').textContent = cours;
  document.getElementById('stat-termine').textContent = termine;
  document.getElementById('stat-heures').textContent = heures + 'h';
}

function renderFormations(list) {
  const tbody = document.querySelector("#formations-table tbody");
  tbody.innerHTML = "";
  
  list.forEach(f => {
    const statusClass = f.statut === "Terminé" ? "badge-termine" : 
                        f.statut === "En cours" ? "badge-cours" : "badge-planifie";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${f.id}</td>
      <td><strong>${f.nom}</strong></td>
      <td>${f.employe}</td>
      <td>${f.debut}</td>
      <td>${f.duree}h</td>
      <td>${f.organisme}</td>
      <td><span class="status-badge ${statusClass}">${f.statut}</span></td>
      <td>
        <button class="edit-btn" onclick="openViewModal(${f.id})">Consulter</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Recherche
document.getElementById("search-formation").addEventListener("input", e => {
  const search = e.target.value.toLowerCase();
  const filtered = formations.filter(f =>
    f.nom.toLowerCase().includes(search) ||
    f.employe.toLowerCase().includes(search) ||
    f.organisme.toLowerCase().includes(search)
  );
  renderFormations(filtered);
});

// Modal Voir
function openViewModal(formationId) {
  const formation = formations.find(f => f.id === formationId);
  if (!formation) return;

  document.getElementById('view-modal-title').textContent = formation.nom;
  document.getElementById('view-modal-subtitle').textContent = `${formation.employe} - ${formation.organisme}`;
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const fields = {
    'Informations': ['nom', 'employe', 'organisme', 'debut', 'duree', 'statut'],
    'Autres': []
  };

  Object.entries(fields).forEach(([section, keys]) => {
    const data = keys.length ? keys.filter(k => formation[k]) : Object.keys(formation).filter(k => !['id'].concat(keys).includes(k));
    
    if (data.length) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem;">${section}</h4>
        </div>
      `;
      
      data.forEach(key => {
        let value = formation[key];
        if (key === 'duree') value = value + ' heures';
        
        body.innerHTML += `
          <div>
            <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">${key}</p>
            <p style="background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-light);">${value}</p>
          </div>
        `;
      });
    }
  });

  document.getElementById('view-formation-modal').style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-formation-modal').style.display = "none";
}

document.getElementById('modal-view-close').onclick = closeViewModal;
window.addEventListener('click', e => {
  if (e.target.id === 'view-formation-modal') closeViewModal();
});

// Modal Ajouter
const modal = document.getElementById("formation-modal");
const addBtn = document.getElementById("add-formation-btn");
const closeModal = document.getElementById("modal-close");

addBtn.onclick = () => {
  modal.style.display = "flex";
  document.getElementById("formation-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

document.getElementById("formation-form").addEventListener("submit", e => {
  e.preventDefault();
  
  const newFormation = {
    id: Date.now(),
    nom: document.getElementById("formation-nom").value,
    employe: document.getElementById("formation-employee").value,
    organisme: document.getElementById("formation-organisme").value,
    debut: document.getElementById("formation-debut").value,
    duree: parseInt(document.getElementById("formation-duree").value),
    statut: "Planifié"
  };
  
  formations.push(newFormation);
  calculateStats();
  renderFormations(formations);
  modal.style.display = "none";
});

loadFormations();
