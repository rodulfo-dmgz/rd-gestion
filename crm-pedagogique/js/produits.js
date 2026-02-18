// =============================================
// MODULE PRODUITS AVEC SUPABASE
// =============================================

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
  
  const dashboardLink = document.createElement("a");
  dashboardLink.href = "../dashboard.html";
  dashboardLink.innerHTML = "🏠 Dashboard";
  nav.appendChild(dashboardLink);
  
  modules.forEach(module => {
    if (moduleLinks[module]) {
      const link = document.createElement("a");
      link.href = moduleLinks[module].url;
      link.innerHTML = `${moduleLinks[module].icon} ${moduleLinks[module].label}`;
      
      if (window.location.pathname.includes(moduleLinks[module].url)) {
        link.classList.add("active");
      }
      
      nav.appendChild(link);
    }
  });
}

// Charger le nom de l'entreprise depuis Supabase
async function loadCompanyName() {
  try {
    const { data, error } = await supabase
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
// GESTION PRODUITS AVEC SUPABASE
// ─────────────────────────────
let produits = [];

async function loadProduits() {
  try {
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    
    produits = data;
    renderProduits(produits);
  } catch (err) {
    console.error("Erreur chargement produits:", err);
    alert("Erreur lors du chargement des produits");
  }
}

function renderProduits(list) {
  const tbody = document.querySelector("#products-table tbody");
  tbody.innerHTML = "";
  list.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nom}</td>
      <td>${p.ventes || "-"}</td>
      <td>${p.stock}</td>
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
function openViewModal(productId) {
  const product = produits.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('view-modal-title').textContent = product.nom;
  document.getElementById('view-modal-subtitle').textContent = product.categorie || 'Produit';
  
  const body = document.getElementById('view-modal-body');
  body.innerHTML = '';

  const sections = {
    'Informations produit': ['id', 'nom', 'categorie'],
    'Stock & Prix': ['stock', 'prix', 'ventes'],
    'Autres': []
  };

  Object.entries(sections).forEach(([sectionTitle, fields]) => {
    const sectionData = fields.length > 0 
      ? fields.filter(field => product[field] !== undefined)
      : Object.keys(product).filter(key => !Object.values(sections).flat().includes(key));

    if (sectionData.length > 0) {
      body.innerHTML += `
        <div style="grid-column: 1 / -1;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--accent); text-transform: uppercase; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light);">${sectionTitle}</h4>
        </div>
      `;

      sectionData.forEach(key => {
        const value = product[key];
        if (value !== undefined) {
          const displayValue = key === 'prix' ? `${value} €` : value;
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

  const modal = document.getElementById('view-product-modal');
  modal.style.display = "flex";
}

function closeViewModal() {
  document.getElementById('view-product-modal').style.display = "none";
}

document.getElementById('modal-view-close').onclick = closeViewModal;

window.addEventListener('click', (e) => {
  const modal = document.getElementById('view-product-modal');
  if (e.target === modal) {
    closeViewModal();
  }
});

// Recherche produit
document.getElementById("search-product").addEventListener("input", e => {
  if (!produits || produits.length === 0) return;
  
  const filtered = produits.filter(p =>
    p.nom.toLowerCase().includes(e.target.value.toLowerCase()) ||
    (p.categorie && p.categorie.toLowerCase().includes(e.target.value.toLowerCase()))
  );
  renderProduits(filtered);
});

// Modal
const modal = document.getElementById("product-modal");
const modalTitle = document.getElementById("modal-title");
const closeModal = document.getElementById("modal-close");
const addBtn = document.getElementById("add-product-btn");

addBtn.onclick = () => {
  modal.style.display = "flex";
  modalTitle.innerText = "Ajouter un produit";
  document.getElementById("product-form").reset();
};

closeModal.onclick = () => modal.style.display = "none";
window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

// Formulaire - AJOUT AVEC SUPABASE
document.getElementById("product-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newProduit = {
    nom: document.getElementById("product-name").value,
    categorie: document.getElementById("product-category").value,
    stock: parseInt(document.getElementById("product-stock").value),
    prix: parseFloat(document.getElementById("product-price").value),
    ventes: 0
  };

  try {
    const { data, error } = await supabase
      .from('produits')
      .insert([newProduit])
      .select();
    
    if (error) throw error;
    
    // Recharger la liste
    await loadProduits();
    modal.style.display = "none";
    alert("Produit ajouté avec succès !");
    
  } catch (err) {
    console.error("Erreur ajout produit:", err);
    alert("Erreur lors de l'ajout du produit");
  }
});

// Initialisation
loadProduits();