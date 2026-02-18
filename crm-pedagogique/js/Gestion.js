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
    arhDivider.innerHTML = '<i data-lucide="clipboard-list" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;stroke:currentColor;"></i> Module Gestion';
    nav.appendChild(arhDivider);

      
    [
      { url: "arh-employes.html", label: "Clients", icon: "idCardLanyard" },
      { url: "salaries.html",     label: "Fournisseurs",            icon: "users" },
      { url: "arh-conges.html",   label: "Produits",              icon: "tree-palm" },
    ].forEach(mod => {
      const link = document.createElement("a");
      link.href = mod.url;
      link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
      if (window.location.pathname.includes(mod.url)) link.classList.add("active");
      nav.appendChild(link);
    });
  }
  
 // Ajouter modules ARH en premier pour ARH
  if (user.service === "ARH" || user.acces_total) {
    const arhDivider = document.createElement("div");
    arhDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase;";
    arhDivider.innerHTML = '<i data-lucide="clipboard-list" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;stroke:currentColor;"></i> Module Ventes';
    nav.appendChild(arhDivider);

      
    [
      { url: "arh-employes.html", label: "Ventes", icon: "idCardLanyard" },
      { url: "salaries.html",     label: "Factures",            icon: "users" },
      { url: "arh-conges.html",   label: "Devis",              icon: "tree-palm" },
    ].forEach(mod => {
      const link = document.createElement("a");
      link.href = mod.url;
      link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
      if (window.location.pathname.includes(mod.url)) link.classList.add("active");
      nav.appendChild(link);
    });
  }

   // Ajouter modules ARH en premier pour ARH
  if (user.service === "ARH" || user.acces_total) {
    const arhDivider = document.createElement("div");
    arhDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase;";
    arhDivider.innerHTML = '<i data-lucide="clipboard-list" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;stroke:currentColor;"></i> Module Finances';
    nav.appendChild(arhDivider);

      
    [
      { url: "arh-employes.html", label: "Achats", icon: "idCardLanyard" },
      { url: "salaries.html",     label: "Dépenses",            icon: "users" },
    ].forEach(mod => {
      const link = document.createElement("a");
      link.href = mod.url;
      link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
      if (window.location.pathname.includes(mod.url)) link.classList.add("active");
      nav.appendChild(link);
    });
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
// GESTION SALARIÉS ARH
// ─────────────────────────────
let employes = [];
let currentFilter = "all";

async function loadEmployes() {
  try {
    employes = await (await fetch("../data/employes.json")).json();
    
    // Ajouter statut aléatoire si absent
    employes = employes.map(e => ({
      ...e,
      statut: e.statut || (Math.random() > 0.1 ? "Actif" : "Congé")
    }));
    
    calculateStats();
    renderEmployes(employes);
  } catch (err) {
    console.error("Erreur:", err);
  }
}

function calculateStats() {
  const total = employes.length;
  const actifs = employes.filter(e => e.statut === "Actif").length;
  const services = [...new Set(employes.map(e => e.service))].length;
  
  // Recrutements du mois (simulation)
  const currentMonth = new Date().getMonth();
  const recrutements = employes.filter(e => {
    if (!e.date_embauche) return false;
    const embaucheMonth = new Date(e.date_embauche).getMonth();
    return embaucheMonth === currentMonth;
  }).length;
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-actifs').textContent = actifs;
  document.getElementById('stat-services').textContent = services;
  document.getElementById('stat-recrutements').textContent = recrutements;
}

function renderEmployes(list) {
  const tbody = document.querySelector("#employees-table tbody");
  tbody.innerHTML = "";
  
  list.forEach(e => {
    const statusClass = e.statut === "Actif" ? "badge-actif" : 
                        e.statut === "Congé" ? "badge-conge" : "badge-inactif";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.id}</td>
      <td><strong>${e.prenom} ${e.nom}</strong></td>
      <td>${e.poste || '-'}</td>
      <td>${e.service || '-'}</td>
      <td>${e.email || '-'}</td>
      <td>${e.date_embauche || '-'}</td>
      <td><span class="employee-badge ${statusClass}">${e.statut || 'Actif'}</span></td>
      <td>
        <button class="edit-btn" onclick="openViewModal(${e.id})">Consulter</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Filtres par service
document.querySelectorAll('.filter-tag').forEach(tag => {
  tag.addEventListener('click', function() {
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    const filter = this.dataset.filter;
    currentFilter = filter;
    
    if (filter === 'all') {
      renderEmployes(employes);
    } else {
      const filtered = employes.filter(e => e.service === filter);
      renderEmployes(filtered);
    }
  });
});

// Recherche
document.getElementById("search-employee").addEventListener("input", e => {
  if (!employes || employes.length === 0) return;

  const search = e.target.value.toLowerCase();
  let filtered = employes;
  
  if (currentFilter !== 'all') {
    filtered = filtered.filter(e => e.service === currentFilter);
  }
  
  filtered = filtered.filter(emp =>
    (emp.nom && emp.nom.toLowerCase().includes(search)) ||
    (emp.prenom && emp.prenom.toLowerCase().includes(search)) ||
    (emp.poste && emp.poste.toLowerCase().includes(search)) ||
    (emp.email && emp.email.toLowerCase().includes(search))
  );
  
  renderEmployes(filtered);
});

// ─────────────────────────────
// MODAL VOIR
// ─────────────────────────────
function openViewModal(employeeId) {
  const employee = employes.find(e => e.id === employeeId);
  if (!employee) return;

  document.getElementById('view-modal-title').textContent = `${employee.prenom} ${employee.nom}`;
  document.getElementById('view-modal-subtitle').textContent = `${employee.poste || ''} - ${employee.service || ''}`;
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const sections = {
    'Informations personnelles': ['id', 'nom', 'prenom', 'email', 'telephone'],
    'Poste et contrat': ['poste', 'service', 'date_embauche', 'statut'],
    'Autres': []
  };

  Object.entries(sections).forEach(([sectionTitle, fields]) => {
    const sectionData = fields.length > 0 
      ? fields.filter(field => employee[field])
      : Object.keys(employee).filter(key => !Object.values(sections).flat().includes(key));

    if (sectionData.length > 0) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light);">${sectionTitle}</h4>
        </div>
      `;

      sectionData.forEach(key => {
        const value = employee[key];
        if (value) {
          body.innerHTML += `
            <div>
              <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">${key}</p>
              <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-light);">${value}</p>
            </div>
          `;
        }
      });
    }
  });

  document.getElementById('view-employee-modal').style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-employee-modal').style.display = "none";
}

document.getElementById('modal-view-close').onclick = closeViewModal;

window.addEventListener('click', (e) => {
  if (e.target.id === 'view-employee-modal') closeViewModal();
});

// Modal ajout
const modal = document.getElementById("employee-modal");
const addBtn = document.getElementById("add-employee-btn");
const closeModal = document.getElementById("modal-close");

addBtn.onclick = () => {
  modal.style.display = "flex";
  document.getElementById("employee-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

document.getElementById("employee-form").addEventListener("submit", e => {
  e.preventDefault();
  const newEmployee = {
    id: Date.now(),
    nom: document.getElementById("employee-lastname").value,
    prenom: document.getElementById("employee-firstname").value,
    poste: document.getElementById("employee-position").value,
    service: document.getElementById("employee-service").value,
    email: document.getElementById("employee-email").value,
    telephone: document.getElementById("employee-phone").value,
    date_embauche: document.getElementById("employee-date").value,
    statut: "Actif"
  };
  
  employes.push(newEmployee);
  calculateStats();
  renderEmployes(employes);
  modal.style.display = "none";
});

loadEmployes();