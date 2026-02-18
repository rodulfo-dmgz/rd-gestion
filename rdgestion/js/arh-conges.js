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
      { url: "arh-employes.html", label: "Gestion de salariés", icon: "briefcase" },
      { url: "salaries.html",     label: "Salariés",            icon: "users" },
      { url: "arh-conges.html",   label: "Congés",              icon: "tree-palm" },
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

// Icônes topbar
lucide.createIcons();

// ─────────────────────────────
// GESTION CONGÉS ARH
// ─────────────────────────────
let conges = [];
let currentFilter = "all";

async function loadConges() {
  try {
    const res = await fetch("../data/conges.json");
    conges = await res.json();
  } catch {
    // Données par défaut
    conges = [
      { id: 1, employe: "Rodulfo DOMINGUEZ", type: "Congés payés", debut: "2026-02-10", fin: "2026-02-14", jours: 5, statut: "Approuvé" },
      { id: 2, employe: "Claire Martin", type: "RTT", debut: "2026-02-05", fin: "2026-02-05", jours: 1, statut: "Approuvé" },
      { id: 3, employe: "Sophie Bernard", type: "Congés payés", debut: "2026-03-01", fin: "2026-03-07", jours: 7, statut: "En attente" },
      { id: 4, employe: "Thomas Dubois", type: "Maladie", debut: "2026-01-28", fin: "2026-01-30", jours: 3, statut: "Approuvé" }
    ];
  }
  
  calculateStats();
  renderConges(conges);
}

function calculateStats() {
  const total = conges.length;
  const attente = conges.filter(c => c.statut === "En attente").length;
  const approuve = conges.filter(c => c.statut === "Approuvé").length;
  const jours = conges.filter(c => c.statut === "Approuvé").reduce((sum, c) => sum + c.jours, 0);
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-attente').textContent = attente;
  document.getElementById('stat-approuve').textContent = approuve;
  document.getElementById('stat-jours').textContent = jours;
}

function renderConges(list) {
  const tbody = document.querySelector("#conges-table tbody");
  tbody.innerHTML = "";
  
  list.forEach(c => {
    const statusClass = c.statut === "Approuvé" ? "badge-approuve" : 
                        c.statut === "En attente" ? "badge-attente" : "badge-refuse";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.id}</td>
      <td><strong>${c.employe}</strong></td>
      <td>${c.type}</td>
      <td>${c.debut}</td>
      <td>${c.fin}</td>
      <td>${c.jours} jour${c.jours > 1 ? 's' : ''}</td>
      <td><span class="status-badge ${statusClass}">${c.statut}</span></td>
      <td>
        <button class="edit-btn" onclick="openViewModal(${c.id})">Consulter</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Recherche
document.getElementById("search-conge").addEventListener("input", e => {
  const search = e.target.value.toLowerCase();
  const filtered = conges.filter(c =>
    c.employe.toLowerCase().includes(search) ||
    c.type.toLowerCase().includes(search)
  );
  renderConges(filtered);
});

// Modal Voir
function openViewModal(congeId) {
  const conge = conges.find(c => c.id === congeId);
  if (!conge) return;

  document.getElementById('view-modal-title').textContent = `Congé - ${conge.employe}`;
  document.getElementById('view-modal-subtitle').textContent = conge.type;
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const fields = {
    'Informations': ['employe', 'type', 'debut', 'fin', 'jours', 'statut'],
    'Autres': []
  };

  Object.entries(fields).forEach(([section, keys]) => {
    const data = keys.length ? keys.filter(k => conge[k]) : Object.keys(conge).filter(k => !['id'].concat(keys).includes(k));
    
    if (data.length) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem;">${section}</h4>
        </div>
      `;
      
      data.forEach(key => {
        body.innerHTML += `
          <div>
            <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">${key}</p>
            <p style="background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-light);">${conge[key]}</p>
          </div>
        `;
      });
    }
  });

  document.getElementById('view-conge-modal').style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-conge-modal').style.display = "none";
}

document.getElementById('modal-view-close').onclick = closeViewModal;
window.addEventListener('click', e => {
  if (e.target.id === 'view-conge-modal') closeViewModal();
});

// Modal Ajouter
const modal = document.getElementById("conge-modal");
const addBtn = document.getElementById("add-conge-btn");
const closeModal = document.getElementById("modal-close");

addBtn.onclick = () => {
  modal.style.display = "flex";
  document.getElementById("conge-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

document.getElementById("conge-form").addEventListener("submit", e => {
  e.preventDefault();
  
  const debut = new Date(document.getElementById("conge-debut").value);
  const fin = new Date(document.getElementById("conge-fin").value);
  const jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
  
  const newConge = {
    id: Date.now(),
    employe: document.getElementById("conge-employee").value,
    type: document.getElementById("conge-type").value,
    debut: document.getElementById("conge-debut").value,
    fin: document.getElementById("conge-fin").value,
    jours: jours,
    statut: "En attente"
  };
  
  conges.push(newConge);
  calculateStats();
  renderConges(conges);
  modal.style.display = "none";
});

loadConges();