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
// GESTION FACTURES
// ─────────────────────────────
let factures = [];

async function loadFactures() {
  try {
    factures = await (await fetch("../data/factures.json")).json();
    renderFactures(factures);
  } catch (err) {
    console.error("Erreur chargement factures:", err);
    // Données par défaut si le fichier n'existe pas
    factures = [
      { id: 1, numero: "FAC-2026-001", client: "Entreprise ABC", date: "2026-01-10", montant_ht: 1200.00, montant_ttc: 1440.00, statut: "Payée" },
      { id: 2, numero: "FAC-2026-002", client: "Société XYZ", date: "2026-01-15", montant_ht: 850.00, montant_ttc: 1020.00, statut: "En attente" },
      { id: 3, numero: "FAC-2026-003", client: "Client DEF", date: "2026-01-20", montant_ht: 2400.00, montant_ttc: 2880.00, statut: "Payée" }
    ];
    renderFactures(factures);
  }
}

function renderFactures(list) {
  const tbody = document.querySelector("#invoices-table tbody");
  tbody.innerHTML = "";
  list.forEach(f => {
    const tr = document.createElement("tr");
    const statutColor = f.statut === 'Payée' ? 'green' : 
                        f.statut === 'En attente' ? 'orange' : 'red';
    
    tr.innerHTML = `
      <td><strong>${f.numero}</strong></td>
      <td>${f.client}</td>
      <td>${f.date}</td>
      <td>${f.montant_ht.toFixed(2)} €</td>
      <td>${f.montant_ttc.toFixed(2)} €</td>
      <td><span style="color: ${statutColor}; font-weight: 600">${f.statut}</span></td>
      <td>
        <button class="edit-btn" data-id="${f.id}" onclick="openViewModal(${f.id})">Consulter</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────
// MODAL VOIR DÉTAILS
// ─────────────────────────────
function openViewModal(invoiceId) {
  const facture = factures.find(f => f.id === invoiceId);
  if (!facture) return;

  document.getElementById('view-modal-title').textContent = `Facture ${facture.numero}`;
  document.getElementById('view-modal-subtitle').textContent = `${facture.client} - ${facture.date}`;
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const sections = {
    'Informations': ['numero', 'client', 'date', 'type'],
    'Montants': ['montant_ht', 'tva', 'montant_ttc'],
    'Paiement': ['statut', 'date_paiement'],
    'Autres': []
  };

  Object.entries(sections).forEach(([sectionTitle, fields]) => {
    const sectionData = fields.length > 0 
      ? fields.filter(field => facture[field] !== undefined && facture[field] !== null)
      : Object.keys(facture).filter(key => !Object.values(sections).flat().includes(key) && key !== 'id');

    if (sectionData.length > 0) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light);">${sectionTitle}</h4>
        </div>
      `;

      sectionData.forEach(key => {
        const value = facture[key];
        if (value !== undefined && value !== null) {
          let displayValue = value;
          if (key.includes('montant') || key === 'tva') {
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

  const modal = document.getElementById('view-invoice-modal');
  modal.style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-invoice-modal').style.display = "none";
}

// Fermer modal view
document.getElementById('modal-view-close').onclick = closeViewModal;

window.addEventListener('click', (e) => {
  const modal = document.getElementById('view-invoice-modal');
  if (e.target === modal) {
    closeViewModal();
  }
});

// Recherche facture
document.getElementById("search-invoice").addEventListener("input", e => {
  if (!factures || factures.length === 0) return;

  const search = e.target.value.toLowerCase();
  const filtered = factures.filter(f =>
    (f.numero && f.numero.toLowerCase().includes(search)) ||
    (f.client && f.client.toLowerCase().includes(search)) ||
    (f.statut && f.statut.toLowerCase().includes(search))
  );
  renderFactures(filtered);
});

// Modal
const modal = document.getElementById("invoice-modal");
const modalTitle = document.getElementById("modal-title");
const closeModal = document.getElementById("modal-close");
const addBtn = document.getElementById("add-invoice-btn");

addBtn.onclick = () => {
  modal.style.display = "flex";
  modalTitle.innerText = "Créer une facture";
  document.getElementById("invoice-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

// Formulaire
document.getElementById("invoice-form").addEventListener("submit", e => {
  e.preventDefault();
  const newInvoice = {
    id: Date.now(),
    numero: document.getElementById("invoice-number").value,
    client: document.getElementById("invoice-client").value,
    date: document.getElementById("invoice-date").value,
    montant_ht: parseFloat(document.getElementById("invoice-ht").value),
    montant_ttc: parseFloat(document.getElementById("invoice-ttc").value),
    statut: "En attente"
  };
  factures.push(newInvoice);
  renderFactures(factures);
  modal.style.display = "none";
});

// Initialisation
loadFactures();