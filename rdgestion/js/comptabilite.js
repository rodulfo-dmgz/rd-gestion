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
// GESTION COMPTABILITÉ
// ─────────────────────────────
let entries = [];

async function loadEntries() {
  try {
    entries = await (await fetch("../data/comptabilite.json")).json();
    renderEntries(entries);
  } catch (err) {
    console.error("Erreur chargement comptabilité:", err);
    // Données par défaut si le fichier n'existe pas
    entries = [
      { id: 1, date: "2026-01-15", libelle: "Achat fournitures", compte: "606100", debit: 250.00, credit: 0 },
      { id: 2, date: "2026-01-20", libelle: "Vente client A", compte: "707000", debit: 0, credit: 1500.00 },
      { id: 3, date: "2026-01-25", libelle: "Paiement loyer", compte: "613000", debit: 800.00, credit: 0 }
    ];
    renderEntries(entries);
  }
}

function renderEntries(list) {
  const tbody = document.querySelector("#accounting-table tbody");
  tbody.innerHTML = "";
  list.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.date}</td>
      <td>${e.libelle}</td>
      <td>${e.compte}</td>
      <td>${e.debit > 0 ? e.debit.toFixed(2) + ' €' : '-'}</td>
      <td>${e.credit > 0 ? e.credit.toFixed(2) + ' €' : '-'}</td>
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
function openViewModal(entryId) {
  const entry = entries.find(e => e.id === entryId);
  if (!entry) return;

  document.getElementById('view-modal-title').textContent = entry.libelle;
  document.getElementById('view-modal-subtitle').textContent = `Compte ${entry.compte} - ${entry.date}`;
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const sections = {
    'Informations': ['id', 'date', 'libelle', 'compte', 'piece'],
    'Montants': ['debit', 'credit'],
    'Autres': []
  };

  Object.entries(sections).forEach(([sectionTitle, fields]) => {
    const sectionData = fields.length > 0 
      ? fields.filter(field => entry[field] !== undefined)
      : Object.keys(entry).filter(key => !Object.values(sections).flat().includes(key));

    if (sectionData.length > 0) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light);">${sectionTitle}</h4>
        </div>
      `;

      sectionData.forEach(key => {
        const value = entry[key];
        if (value !== undefined && value !== 0) {
          let displayValue = value;
          if (key === 'debit' || key === 'credit') {
            displayValue = `${parseFloat(value).toFixed(2)} €`;
          }
          
          body.innerHTML += `
            <div>
              <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">${key}</p>
              <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-light);">${displayValue}</p>
            </div>
          `;
        }
      });
    }
  });

  const modal = document.getElementById('view-entry-modal');
  modal.style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-entry-modal').style.display = "none";
}

// Fermer modal view
document.getElementById('modal-view-close').onclick = closeViewModal;

window.addEventListener('click', (e) => {
  const modal = document.getElementById('view-entry-modal');
  if (e.target === modal) {
    closeViewModal();
  }
});

// Recherche écriture
document.getElementById("search-entry").addEventListener("input", e => {
  if (!entries || entries.length === 0) return;

  const search = e.target.value.toLowerCase();
  const filtered = entries.filter(entry =>
    (entry.libelle && entry.libelle.toLowerCase().includes(search)) ||
    (entry.compte && entry.compte.includes(search)) ||
    (entry.date && entry.date.includes(search))
  );
  renderEntries(filtered);
});

// Modal
const modal = document.getElementById("entry-modal");
const modalTitle = document.getElementById("modal-title");
const closeModal = document.getElementById("modal-close");
const addBtn = document.getElementById("add-entry-btn");

addBtn.onclick = () => {
  modal.style.display = "flex";
  modalTitle.innerText = "Nouvelle écriture comptable";
  document.getElementById("entry-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

// Formulaire
document.getElementById("entry-form").addEventListener("submit", e => {
  e.preventDefault();
  const newEntry = {
    id: Date.now(),
    date: document.getElementById("entry-date").value,
    libelle: document.getElementById("entry-label").value,
    compte: document.getElementById("entry-account").value,
    debit: parseFloat(document.getElementById("entry-debit").value) || 0,
    credit: parseFloat(document.getElementById("entry-credit").value) || 0
  };
  entries.push(newEntry);
  renderEntries(entries);
  modal.style.display = "none";
});

// Initialisation
loadEntries();