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
// GESTION CLIENTS
// ─────────────────────────────
let clients = [];

async function loadClients() {
  clients = await (await fetch("../data/clients.json")).json();
  renderClients(clients);
}

function renderClients(list) {
  const tbody = document.querySelector("#clients-table tbody");
  tbody.innerHTML = "";
  list.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.nom}</td>
      <td>${c.prenom || ''}</td>
      <td>${c.email || ''}</td>
      <td>${c.ville || ''}</td>
      <td>
        <button class="edit-btn" data-id="${c.id}" onclick="openViewModal(${c.id})">Consulter</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────
// MODAL VOIR DÉTAILS
// ─────────────────────────────
function openViewModal(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;

  document.getElementById('view-modal-title').textContent = `${client.prenom || ''} ${client.nom}`;
  document.getElementById('view-modal-subtitle').textContent = client.email || 'Client';
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const sections = {
    'Informations personnelles': ['id', 'nom', 'prenom', 'email'],
    'Localisation': ['ville', 'pays', 'adresse', 'code_postal'],
    'Autres': []
  };

  Object.entries(sections).forEach(([sectionTitle, fields]) => {
    const sectionData = fields.length > 0 
      ? fields.filter(field => client[field])
      : Object.keys(client).filter(key => !Object.values(sections).flat().includes(key));

    if (sectionData.length > 0) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light);">${sectionTitle}</h4>
        </div>
      `;

      sectionData.forEach(key => {
        const value = client[key];
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

  const modal = document.getElementById('view-client-modal');
  modal.style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-client-modal').style.display = "none";
}

// Fermer modal view
document.getElementById('modal-view-close').onclick = closeViewModal;

window.addEventListener('click', (e) => {
  const modal = document.getElementById('view-client-modal');
  if (e.target === modal) {
    closeViewModal();
  }
});

// Recherche client
document.getElementById("search-client").addEventListener("input", e => {
  if (!clients || clients.length === 0) return;

  const search = e.target.value.toLowerCase();
  const filtered = clients.filter(c =>
    (c.nom && c.nom.toLowerCase().includes(search)) ||
    (c.prenom && c.prenom.toLowerCase().includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search)) ||
    (c.ville && c.ville.toLowerCase().includes(search)) 
  );
  renderClients(filtered);
});

// Modal
const modal = document.getElementById("client-modal");
const modalTitle = document.getElementById("modal-title");
const closeModal = document.getElementById("modal-close");
const addBtn = document.getElementById("add-client-btn");

addBtn.onclick = () => {
  modal.style.display = "flex";
  modalTitle.innerText = "Ajouter un client";
  document.getElementById("client-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

// Formulaire
document.getElementById("client-form").addEventListener("submit", e => {
  e.preventDefault();
  const newClient = {
    id: Date.now(),
    nom: document.getElementById("client-lastname").value,
    prenom: document.getElementById("client-firstname").value,
    email: document.getElementById("client-email").value,
    ville: document.getElementById("client-city").value
  };
  clients.push(newClient);
  renderClients(clients);
  modal.style.display = "none";
});

// Initialisation
loadClients();