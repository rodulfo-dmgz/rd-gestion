// =============================================
// MODULE CLIENTS AVEC SUPABASE
// =============================================

// Initialisation Supabase depuis CDN UMD
const SUPABASE_URL = 'https://iomzcbmyzjwtswrkvxqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXpjYm15emp3dHN3cmt2eHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjM4MTAsImV4cCI6MjA4NTc5OTgxMH0.ap4Fk6pxGZgVSAdb6krWbv8CM-Dzw0ZQRcsKPKScSVw';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  
  // Ajouter modules SA en premier pour SA
  if (user.service === "SA" || user.acces_total) {
    const saDivider = document.createElement("div");
    saDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase;";
    saDivider.innerHTML = '<i data-lucide="folder open" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;stroke:currentColor;"></i> Module assistant administrative';
    nav.appendChild(saDivider);

      
    [
      { url: "clients.html",        label: "Clients", icon: "users" },
      { url: "planning.html",       label: "Planification",     icon: "calendar" },
      { url: "dossiers.html",       label: "Dossiers",           icon: "folder" },
      { url: "documents.html",      label: "Documents",          icon: "file-text" }
    ].forEach(mod => {
      const link = document.createElement("a");
      link.href = mod.url;
      link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
      if (window.location.pathname.includes(mod.url)) link.classList.add("active");
      nav.appendChild(link);
    });
  }
  
  if (user.service === "AC" || user.acces_total) {
    const acDivider = document.createElement("div");
    acDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase;";
    acDivider.innerHTML = '<i data-lucide="chart-no-axes-combined" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;stroke:currentColor;"></i> Module Commercial';
    nav.appendChild(acDivider);

    [
      { url: "prospects.html",      label: "Prospects",          icon: "user-plus" },
      { url: "opportunites.html",   label: "Opportunités",       icon: "target" },
      { url: "devis.html",           label: "Devis",              icon: "file-check" },
      { url: "commandes.html",      label: "Commandes",          icon: "shopping-cart" }
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

// Charger le nom de l'entreprise depuis Supabase
async function loadCompanyName() {
  try {
    const { data, error } = await supabaseClient
      .from('entreprise')
      .select('nom')
      .single();
    
    if (error) throw error;
    
    document.getElementById("company-name").innerText = data.nom || "CRM";
  } catch (err) {
    console.error("Erreur chargement entreprise:", err);
    document.getElementById("company-name").innerText = "CRM";
  }
}

generateNavigation();
loadCompanyName();

// ─────────────────────────────
// GESTION CLIENTS AVEC SUPABASE
// ─────────────────────────────
let clients = [];

async function loadClients() {
  try {
    const { data, error } = await supabaseClient
      .from('clients')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    
    clients = data;
    renderClients(clients);
  } catch (err) {
    console.error("Erreur chargement clients:", err);
    alert("Erreur lors du chargement des clients");
  }
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

// Formulaire - AJOUT AVEC SUPABASE
document.getElementById("client-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const newClient = {
    nom: document.getElementById("client-lastname").value,
    prenom: document.getElementById("client-firstname").value,
    email: document.getElementById("client-email").value,
    ville: document.getElementById("client-city").value,
    pays: 'France'
  };
  
  try {
    const { data, error } = await supabaseClient
      .from('clients')
      .insert([newClient])
      .select();
    
    if (error) throw error;
    
    // Recharger la liste
    await loadClients();
    modal.style.display = "none";
    alert("Client ajouté avec succès !");
    
  } catch (err) {
    console.error("Erreur ajout client:", err);
    alert("Erreur lors de l'ajout du client");
  }
});

// Initialisation
loadClients();