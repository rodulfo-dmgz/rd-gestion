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
// GESTION PAIE
// ─────────────────────────────
let paies = [];

async function loadPaies() {
  try {
    paies = await (await fetch("../data/paie.json")).json();
    renderPaies(paies);
  } catch (err) {
    console.error("Erreur chargement paies:", err);
    // Données par défaut si le fichier n'existe pas
    paies = [
      { id: 1, employe: "Sophie Martin", periode: "2026-01", salaire_brut: 3500, salaire_net: 2700, statut: "Payé" },
      { id: 2, employe: "Thomas Dubois", periode: "2026-01", salaire_brut: 3200, salaire_net: 2480, statut: "En attente" },
      { id: 3, employe: "Julie Bernard", periode: "2026-01", salaire_brut: 4500, salaire_net: 3420, statut: "Payé" }
    ];
    renderPaies(paies);
  }
}

function renderPaies(list) {
  const tbody = document.querySelector("#payroll-table tbody");
  tbody.innerHTML = "";
  list.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.employe}</td>
      <td>${formatPeriod(p.periode)}</td>
      <td>${p.salaire_brut.toFixed(2)} €</td>
      <td>${p.salaire_net.toFixed(2)} €</td>
      <td><span style="color: ${p.statut === 'Payé' ? 'var(--success)' : 'var(--warning)'}">${p.statut}</span></td>
      <td>
        <button class="edit-btn" data-id="${p.id}" onclick="openViewModal(${p.id})">Consulter</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────
// MODAL VOIR DÉTAILS
// ─────────────────────────────
function openViewModal(payrollId) {
  const paie = paies.find(p => p.id === payrollId);
  if (!paie) return;

  document.getElementById('view-modal-title').textContent = `Bulletin de paie - ${paie.employe}`;
  document.getElementById('view-modal-subtitle').textContent = formatPeriod(paie.periode);
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const sections = {
    'Employé': ['employe', 'periode'],
    'Rémunération': ['salaire_brut', 'salaire_net', 'cotisations'],
    'Statut': ['statut', 'date_paiement'],
    'Autres': []
  };

  Object.entries(sections).forEach(([sectionTitle, fields]) => {
    const sectionData = fields.length > 0 
      ? fields.filter(field => paie[field] !== undefined && paie[field] !== null)
      : Object.keys(paie).filter(key => !Object.values(sections).flat().includes(key));

    if (sectionData.length > 0) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light);">${sectionTitle}</h4>
        </div>
      `;

      sectionData.forEach(key => {
        const value = paie[key];
        if (value !== undefined && value !== null) {
          let displayValue = value;
          if (key.includes('salaire') || key === 'cotisations') {
            displayValue = `${parseFloat(value).toFixed(2)} €`;
          } else if (key === 'periode') {
            displayValue = formatPeriod(value);
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

  const modal = document.getElementById('view-payroll-modal');
  modal.style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-payroll-modal').style.display = "none";
}

// Fermer modal view
document.getElementById('modal-view-close').onclick = closeViewModal;

window.addEventListener('click', (e) => {
  const modal = document.getElementById('view-payroll-modal');
  if (e.target === modal) {
    closeViewModal();
  }
});

function formatPeriod(period) {
  const [year, month] = period.split('-');
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

// Recherche paie
document.getElementById("search-payroll").addEventListener("input", e => {
  if (!paies || paies.length === 0) return;

  const search = e.target.value.toLowerCase();
  const filtered = paies.filter(p =>
    (p.employe && p.employe.toLowerCase().includes(search)) ||
    (p.periode && p.periode.includes(search)) ||
    (p.statut && p.statut.toLowerCase().includes(search))
  );
  renderPaies(filtered);
});

// Modal
const modal = document.getElementById("payroll-modal");
const modalTitle = document.getElementById("modal-title");
const closeModal = document.getElementById("modal-close");
const addBtn = document.getElementById("add-payroll-btn");

addBtn.onclick = () => {
  modal.style.display = "flex";
  modalTitle.innerText = "Générer un bulletin de paie";
  document.getElementById("payroll-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

// Formulaire
document.getElementById("payroll-form").addEventListener("submit", e => {
  e.preventDefault();
  const newPayroll = {
    id: Date.now(),
    employe: document.getElementById("payroll-employee").value,
    periode: document.getElementById("payroll-period").value,
    salaire_brut: parseFloat(document.getElementById("payroll-gross").value),
    salaire_net: parseFloat(document.getElementById("payroll-net").value),
    statut: "En attente"
  };
  paies.push(newPayroll);
  renderPaies(paies);
  modal.style.display = "none";
});

// Initialisation
loadPaies();