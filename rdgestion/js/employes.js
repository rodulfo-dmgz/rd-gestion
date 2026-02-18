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

// Charger le nom de l'entreprise
fetch("../data/entreprise.json")
  .then(r => r.json())
  .then(data => document.getElementById("company-name").innerText = data.nom || "CRM");

// Générer la navigation
generateNavigation();

// Icônes topbar
lucide.createIcons();

// ─────────────────────────────
// GESTION SALARIÉS
// ─────────────────────────────
let employes = [];

async function loadEmployes() {
  try {
    employes = await (await fetch("../data/employes.json")).json();
    renderEmployes(employes);
  } catch (err) {
    console.error("Erreur chargement Salariés:", err);
    // Données par défaut si le fichier n'existe pas
    employes = [
      { id: 1, nom: "Martin", prenom: "Sophie", poste: "Développeur", service: "IT", email: "sophie.martin@exemple.fr" },
      { id: 2, nom: "Dubois", prenom: "Thomas", poste: "Designer", service: "Marketing", email: "thomas.dubois@exemple.fr" },
      { id: 3, nom: "Bernard", prenom: "Julie", poste: "Manager", service: "RH", email: "julie.bernard@exemple.fr" }
    ];
    renderEmployes(employes);
  }
}

function renderEmployes(list) {
  const tbody = document.querySelector("#employees-table tbody");
  tbody.innerHTML = "";
  list.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.nom}</td>
      <td>${e.prenom}</td>
      <td>${e.poste || '-'}</td>
      <td>${e.service || '-'}</td>
      <td>${e.email || '-'}</td>
      <td>
        <button class="edit-btn" data-id="${e.id}" onclick="openViewModal(${e.id})">Consulter</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────
// MODAL VOIR DÉTAILS
// ─────────────────────────────
function openViewModal(employeeId) {
  const employee = employes.find(e => e.id === employeeId);
  if (!employee) return;

  document.getElementById('view-modal-title').textContent = `${employee.prenom} ${employee.nom}`;
  document.getElementById('view-modal-subtitle').textContent = `${employee.poste || ''} - ${employee.service || ''}`;
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const sections = {
    'Informations personnelles': ['id', 'nom', 'prenom', 'email', 'telephone', 'date_embauche'],
    'Poste': ['poste', 'service', 'date_embauche'],
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

  const modal = document.getElementById('view-employee-modal');
  modal.style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-employee-modal').style.display = "none";
}

// Fermer modal view
document.getElementById('modal-view-close').onclick = closeViewModal;

window.addEventListener('click', (e) => {
  const modal = document.getElementById('view-employee-modal');
  if (e.target === modal) {
    closeViewModal();
  }
});

// Recherche employé
document.getElementById("search-employee").addEventListener("input", e => {
  if (!employes || employes.length === 0) return;

  const search = e.target.value.toLowerCase();
  const filtered = employes.filter(emp =>
    (emp.nom && emp.nom.toLowerCase().includes(search)) ||
    (emp.prenom && emp.prenom.toLowerCase().includes(search)) ||
    (emp.poste && emp.poste.toLowerCase().includes(search)) ||
    (emp.service && emp.service.toLowerCase().includes(search)) ||
    (emp.email && emp.email.toLowerCase().includes(search))
  );
  renderEmployes(filtered);
});

// Modal
const modal = document.getElementById("employee-modal");
const modalTitle = document.getElementById("modal-title");
const closeModal = document.getElementById("modal-close");
const addBtn = document.getElementById("add-employee-btn");

addBtn.onclick = () => {
  modal.style.display = "flex";
  modalTitle.innerText = "Ajouter un employé";
  document.getElementById("employee-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

// Formulaire
document.getElementById("employee-form").addEventListener("submit", e => {
  e.preventDefault();
  const newEmployee = {
    id: Date.now(),
    nom: document.getElementById("employee-lastname").value,
    prenom: document.getElementById("employee-firstname").value,
    poste: document.getElementById("employee-position").value,
    service: document.getElementById("employee-service").value,
    email: document.getElementById("employee-email").value
  };
  employes.push(newEmployee);
  renderEmployes(employes);
  modal.style.display = "none";
});

// Initialisation
loadEmployes();