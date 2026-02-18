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
// GESTION VENTES
// ─────────────────────────────
let ventes = [];

async function loadVentes() {
  ventes = await (await fetch("../data/ventes.json")).json();
  renderVentes(ventes);
}

function renderVentes(list) {
  const tbody = document.querySelector("#sales-table tbody");
  tbody.innerHTML = "";
  list.forEach(v => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.id}</td>
      <td>${v.client}</td>
      <td>${v.produit}</td>
      <td>${v.quantite}</td>
      <td>${v.montant.toFixed(2)}</td>
      <td>${v.date}</td>
      <td>
        <button class="edit-btn" data-id="${v.id}" onclick="openViewModal(${v.id})">Consulter</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────
// MODAL Consulter DÉTAILS
// ─────────────────────────────
function openViewModal(saleId) {
  const vente = ventes.find(v => v.id === saleId);
  if (!vente) return;

  document.getElementById('view-modal-title').textContent = `Vente #${vente.id}`;
  document.getElementById('view-modal-subtitle').textContent = `${vente.client} - ${vente.produit}`;
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const sections = {
    'Informations vente': ['id', 'client', 'produit', 'date'],
    'Montants': ['quantite', 'montant'],
    'Autres': []
  };

  Object.entries(sections).forEach(([sectionTitle, fields]) => {
    const sectionData = fields.length > 0 
      ? fields.filter(field => vente[field] !== undefined)
      : Object.keys(vente).filter(key => !Object.values(sections).flat().includes(key));

    if (sectionData.length > 0) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light);">${sectionTitle}</h4>
        </div>
      `;

      sectionData.forEach(key => {
        const value = vente[key];
        if (value !== undefined) {
          const displayValue = key === 'montant' ? `${value.toFixed(2)} €` : value;
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

  const modal = document.getElementById('view-sale-modal');
  modal.style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-sale-modal').style.display = "none";
}

// Fermer modal view
document.getElementById('modal-view-close').onclick = closeViewModal;

window.addEventListener('click', (e) => {
  const modal = document.getElementById('view-sale-modal');
  if (e.target === modal) {
    closeViewModal();
  }
});

// Recherche ventes
document.getElementById("search-sale").addEventListener("input", e => {
  if (!ventes || ventes.length === 0) return;
  
  const search = e.target.value.toLowerCase();
  const filtered = ventes.filter(v =>
    (v.client && v.client.toLowerCase().includes(search)) ||
    (v.produit && v.produit.toLowerCase().includes(search))||
    (v.date && v.date.toLowerCase().includes(search))
  );
  renderVentes(filtered);
});

// Modal
const modal = document.getElementById("sale-modal");
const modalTitle = document.getElementById("modal-title");
const closeModal = document.getElementById("modal-close");
const addBtn = document.getElementById("add-sale-btn");

addBtn.onclick = () => {
  modal.style.display = "flex";
  modalTitle.innerText = "Ajouter une vente";
  document.getElementById("sale-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

// Formulaire
document.getElementById("sale-form").addEventListener("submit", e => {
  e.preventDefault();
  const newVente = {
    id: Date.now(),
    client: document.getElementById("sale-client").value,
    produit: document.getElementById("sale-product").value,
    quantite: Number(document.getElementById("sale-quantity").value),
    montant: Number(document.getElementById("sale-amount").value),
    date: document.getElementById("sale-date").value
  };
  ventes.push(newVente);
  renderVentes(ventes);
  modal.style.display = "none";
});

// Initialisation
loadVentes();