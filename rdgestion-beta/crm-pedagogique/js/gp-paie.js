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

// Données paie
let paies = [];
const TAUX_COTISATION = 0.23; // 23%

async function loadPaies() {
  try {
    paies = await (await fetch("../data/paie.json")).json();
  } catch {
    paies = [];
  }
  
  calculateStats();
  renderPaies(paies);
}

function calculateStats() {
  const total = paies.length;
  const masseBrut = paies.reduce((sum, p) => sum + p.salaire_brut, 0);
  const totalCotisations = paies.reduce((sum, p) => sum + (p.cotisations || 0), 0);
  const totalNet = paies.reduce((sum, p) => sum + p.salaire_net, 0);
  
  document.getElementById('stat-bulletins').textContent = total;
  document.getElementById('stat-masse').textContent = masseBrut.toFixed(2) + ' €';
  document.getElementById('stat-cotisations').textContent = totalCotisations.toFixed(2) + ' €';
  document.getElementById('stat-net').textContent = totalNet.toFixed(2) + ' €';
}

function formatPeriod(period) {
  const [year, month] = period.split('-');
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function renderPaies(list) {
  const tbody = document.querySelector("#payroll-table tbody");
  tbody.innerHTML = "";
  
  list.forEach(p => {
    const statusClass = p.statut === "Payé" ? "badge-paye" : "badge-attente";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td><strong>${p.employe}</strong></td>
      <td>${formatPeriod(p.periode)}</td>
      <td>${p.salaire_brut.toFixed(2)} €</td>
      <td>${(p.cotisations || 0).toFixed(2)} €</td>
      <td>${p.salaire_net.toFixed(2)} €</td>
      <td><span class="status-badge ${statusClass}">${p.statut}</span></td>
      <td>
        <button class="edit-btn" onclick="openViewModal(${p.id})">👁️ Voir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Recherche
document.getElementById("search-payroll").addEventListener("input", e => {
  const search = e.target.value.toLowerCase();
  const filtered = paies.filter(p =>
    p.employe.toLowerCase().includes(search) ||
    p.periode.includes(search)
  );
  renderPaies(filtered);
});

// Calcul automatique dans le formulaire
document.getElementById("payroll-gross").addEventListener("input", e => {
  const brut = parseFloat(e.target.value) || 0;
  const cotisations = brut * TAUX_COTISATION;
  const net = brut - cotisations;
  
  document.getElementById('calc-cotisations').textContent = cotisations.toFixed(2) + ' €';
  document.getElementById('calc-net').textContent = net.toFixed(2) + ' €';
});

// Modal Voir avec calculs détaillés
function openViewModal(payrollId) {
  const paie = paies.find(p => p.id === payrollId);
  if (!paie) return;

  document.getElementById('view-modal-title').textContent = `Bulletin de paie - ${paie.employe}`;
  document.getElementById('view-modal-subtitle').textContent = formatPeriod(paie.periode);
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const fields = {
    'Employé': ['employe', 'periode'],
    'Rémunération': ['salaire_brut', 'cotisations', 'salaire_net'],
    'Paiement': ['statut', 'date_paiement'],
    'Autres': []
  };

  Object.entries(fields).forEach(([section, keys]) => {
    const data = keys.length ? keys.filter(k => paie[k] !== undefined && paie[k] !== null) : Object.keys(paie).filter(k => !['id'].concat(Object.values(fields).flat()).includes(k));
    
    if (data.length) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem;">${section}</h4>
        </div>
      `;
      
      data.forEach(key => {
        let value = paie[key];
        if (key.includes('salaire') || key === 'cotisations') {
          value = parseFloat(value).toFixed(2) + ' €';
        } else if (key === 'periode') {
          value = formatPeriod(value);
        }
        
        body.innerHTML += `
          <div>
            <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">${key}</p>
            <p style="background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-light);">${value}</p>
          </div>
        `;
      });
    }
  });
  
  // Détails calculs
  const calcDetails = document.getElementById('calc-details');
  const brut = parseFloat(paie.salaire_brut);
  const cotisations = parseFloat(paie.cotisations || (brut * TAUX_COTISATION));
  const net = parseFloat(paie.salaire_net);
  
  calcDetails.innerHTML = `
    <div class="calc-line">
      <span>Salaire brut mensuel</span>
      <span>${brut.toFixed(2)} €</span>
    </div>
    <div class="calc-line">
      <span>Cotisations salariales (${(TAUX_COTISATION * 100).toFixed(0)}%)</span>
      <span style="color: #ef4444;">- ${cotisations.toFixed(2)} €</span>
    </div>
    <div class="calc-line">
      <span><strong>Net à payer</strong></span>
      <span><strong>${net.toFixed(2)} €</strong></span>
    </div>
  `;

  document.getElementById('view-payroll-modal').style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-payroll-modal').style.display = "none";
}

document.getElementById('modal-view-close').onclick = closeViewModal;
window.addEventListener('click', e => {
  if (e.target.id === 'view-payroll-modal') closeViewModal();
});

// Modal Ajouter
const modal = document.getElementById("payroll-modal");
const addBtn = document.getElementById("add-payroll-btn");
const closeModal = document.getElementById("modal-close");

addBtn.onclick = () => {
  modal.style.display = "flex";
  document.getElementById("payroll-form").reset();
  document.getElementById('calc-cotisations').textContent = '0.00 €';
  document.getElementById('calc-net').textContent = '0.00 €';
};

closeModal.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

document.getElementById("payroll-form").addEventListener("submit", e => {
  e.preventDefault();
  
  const brut = parseFloat(document.getElementById("payroll-gross").value);
  const cotisations = brut * TAUX_COTISATION;
  const net = brut - cotisations;
  
  const newPayroll = {
    id: Date.now(),
    employe: document.getElementById("payroll-employee").value,
    periode: document.getElementById("payroll-period").value,
    salaire_brut: brut,
    cotisations: cotisations,
    salaire_net: net,
    statut: "En attente",
    date_paiement: null
  };
  
  paies.push(newPayroll);
  calculateStats();
  renderPaies(paies);
  modal.style.display = "none";
});

loadPaies();
