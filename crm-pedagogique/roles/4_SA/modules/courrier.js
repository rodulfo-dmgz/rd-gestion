// =============================================
// MODULE COURRIER - GESTION COURRIER ENTRANT/SORTANT
// VERSION GITHUB PAGES
// =============================================

console.log('📍 courrier.js chargé');

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCourrier);
} else {
  initCourrier();
}

function initCourrier() {
  console.log('🚀 Initialisation du module Courrier');
  
  // Vérifier Supabase
  const supabaseClient = window.supabase || window.supabaseClient;
  
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    console.error('❌ Client Supabase invalide');
    alert('Erreur: Configuration Supabase manquante');
    return;
  }

  // Vérification utilisateur
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "../../../index.html";
    return;
  }

  console.log('✅ Utilisateur connecté:', user.nom);

  document.getElementById("user-info").innerHTML = `<i data-lucide="user"></i> ${user.nom} - ${user.role}`;
  document.getElementById("logout").onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "../../../index.html";
  };

  // ─────────────────────────────────────────────
  // VARIABLES GLOBALES
  // ─────────────────────────────────────────────
  let mails = [];
  let currentMail = null;
  let activeFilters = {
    type: 'all',
    statuses: ['nouveau', 'en_cours', 'traite'],
    priorities: ['urgent', 'normal', 'faible'],
    categories: ['facture', 'contrat', 'administratif', 'commercial']
  };

  // ─────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────
  function generateNavigation() {
    const nav = document.getElementById("sidebar-nav");
    nav.innerHTML = '';

    const dashboardLink = document.createElement("a");
    const saDashboard = document.createElement("a");
    saDashboard.href = "../index-sa.html";
    saDashboard.innerHTML = '<i data-lucide="layout-grid"></i> Dashboard SA';
    nav.appendChild(saDashboard);

    const saDivider = document.createElement("div");
    saDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;";
    saDivider.innerHTML = '<i data-lucide="briefcase" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i> Secrétariat';
    nav.appendChild(saDivider);

    const saModules = [
      { url: "agenda.html", label: "Agenda", icon: "calendar" },
      { url: "courrier.html", label: "Gestion Courrier", icon: "mail" },
      { url: "communication.html", label: "Communication", icon: "phone" },
      { url: "organisation.html", label: "Organisation", icon: "briefcase" },
      { url: "documents.html", label: "Documents", icon: "file-text" }
    ];

    saModules.forEach(mod => {
      const link = document.createElement("a");
      link.href = mod.url;
      link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
      if (window.location.pathname.includes(mod.url)) link.classList.add("active");
      nav.appendChild(link);
    });

    lucide.createIcons();
  }

  fetch("../../../data/entreprise.json")
    .then(r => r.json())
    .then(data => document.getElementById("company-name").textContent = data.nom || "CRM")
    .catch(err => console.error("Erreur:", err));

  generateNavigation();
  lucide.createIcons();

  // ─────────────────────────────────────────────
  // CHARGEMENT COURRIERS DEPUIS SUPABASE
  // ─────────────────────────────────────────────
  async function loadMails() {
    try {
      console.log('📥 Chargement des courriers...');
      
      const { data, error } = await supabaseClient
        .from('courrier')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      mails = data || [];
      console.log('✅ Courriers chargés:', mails.length);
      
      calculateStats();
      renderMails();
      
    } catch (err) {
      console.error("❌ Erreur chargement courriers:", err);
      mails = [];
      calculateStats();
      renderMails();
    }
  }

  // ─────────────────────────────────────────────
  // STATISTIQUES
  // ─────────────────────────────────────────────
  function calculateStats() {
    const total = mails.length;
    const nouveau = mails.filter(m => m.status === 'nouveau').length;
    const urgent = mails.filter(m => m.priority === 'urgent').length;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-nouveau').textContent = nouveau;
    document.getElementById('stat-urgent').textContent = urgent;
  }

  // ─────────────────────────────────────────────
  // RENDU LISTE COURRIERS
  // ─────────────────────────────────────────────
  function renderMails() {
    const container = document.getElementById('mail-container');
    container.innerHTML = '';

    let filteredMails = mails.filter(mail => {
      // Filtre type
      if (activeFilters.type !== 'all' && mail.type !== activeFilters.type) return false;
      
      // Filtre statut
      if (!activeFilters.statuses.includes(mail.status)) return false;
      
      // Filtre priorité
      if (!activeFilters.priorities.includes(mail.priority)) return false;
      
      // Filtre catégorie
      if (mail.category && !activeFilters.categories.includes(mail.category)) return false;
      
      return true;
    });

    // Recherche
    const searchTerm = document.getElementById('search-mail').value.toLowerCase();
    if (searchTerm) {
      filteredMails = filteredMails.filter(m => 
        m.objet.toLowerCase().includes(searchTerm) ||
        (m.expediteur && m.expediteur.toLowerCase().includes(searchTerm)) ||
        (m.destinataire && m.destinataire.toLowerCase().includes(searchTerm)) ||
        (m.reference && m.reference.toLowerCase().includes(searchTerm))
      );
    }

    if (filteredMails.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 3rem;">Aucun courrier trouvé</p>';
      return;
    }

    filteredMails.forEach(mail => {
      const item = document.createElement('div');
      item.className = `mail-item priority-${mail.priority}`;
      
      const date = mail.type === 'entrant' ? mail.date_reception : mail.date_envoi;
      const contact = mail.type === 'entrant' ? mail.expediteur : mail.destinataire;
      
      item.innerHTML = `
        <div class="mail-icon ${mail.type}">
          <i data-lucide="${mail.type === 'entrant' ? 'inbox' : 'send'}"></i>
        </div>
        <div class="mail-content">
          <div class="mail-header">
            ${mail.reference ? `<span class="mail-reference">${mail.reference}</span>` : ''}
            ${mail.category ? `<span class="category-badge category-${mail.category}">${getCategoryLabel(mail.category)}</span>` : ''}
          </div>
          <div class="mail-subject">${mail.objet}</div>
          <div class="mail-meta">
            <span><i data-lucide="user"></i> ${contact || 'Non renseigné'}</span>
            <span><i data-lucide="calendar"></i> ${date ? new Date(date).toLocaleDateString('fr-FR') : '-'}</span>
            ${mail.priority ? `<span><i data-lucide="alert-circle"></i> ${getPriorityLabel(mail.priority)}</span>` : ''}
          </div>
        </div>
        <span class="mail-status status-${mail.status}">${getStatusLabel(mail.status)}</span>
        <div class="mail-actions">
          <button onclick="viewMail(${mail.id})" title="Voir détails">
            <i data-lucide="eye"></i>
          </button>
          <button onclick="editMail(${mail.id})" title="Modifier">
            <i data-lucide="edit"></i>
          </button>
          <button onclick="deleteMail(${mail.id})" title="Supprimer">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      
      container.appendChild(item);
    });

    lucide.createIcons();
  }

  function getStatusLabel(status) {
    const labels = {
      'nouveau': 'Nouveau',
      'en_cours': 'En cours',
      'traite': 'Traité',
      'archive': 'Archivé'
    };
    return labels[status] || status;
  }
  
  function getPriorityLabel(priority) {
    const labels = {
      'urgent': 'Urgent',
      'normal': 'Normal',
      'faible': 'Faible'
    };
    return labels[priority] || priority;
  }
  
  function getCategoryLabel(category) {
    const labels = {
      'facture': 'Facture',
      'contrat': 'Contrat',
      'administratif': 'Administratif',
      'commercial': 'Commercial',
      'autre': 'Autre'
    };
    return labels[category] || category;
  }

  // ─────────────────────────────────────────────
  // FILTRES
  // ─────────────────────────────────────────────
  
  // Filtre type (radio)
  document.querySelectorAll('input[name="type-filter"]').forEach(radio => {
    radio.addEventListener('change', function() {
      activeFilters.type = this.value;
      renderMails();
    });
  });

  // Filtres statut
  document.querySelectorAll('#filter-nouveau, #filter-en_cours, #filter-traite, #filter-archive').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        activeFilters.statuses.push(this.value);
      } else {
        activeFilters.statuses = activeFilters.statuses.filter(s => s !== this.value);
      }
      renderMails();
    });
  });

  // Filtres priorité
  document.querySelectorAll('#filter-urgent, #filter-normal, #filter-faible').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        activeFilters.priorities.push(this.value);
      } else {
        activeFilters.priorities = activeFilters.priorities.filter(p => p !== this.value);
      }
      renderMails();
    });
  });

  // Filtres catégorie
  document.querySelectorAll('#filter-facture, #filter-contrat, #filter-administratif, #filter-commercial').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        activeFilters.categories.push(this.value);
      } else {
        activeFilters.categories = activeFilters.categories.filter(c => c !== this.value);
      }
      renderMails();
    });
  });

  // Recherche
  document.getElementById('search-mail').addEventListener('input', () => {
    renderMails();
  });

  // ─────────────────────────────────────────────
  // MODAL AJOUTER/MODIFIER
  // ─────────────────────────────────────────────
  const modal = document.getElementById('mail-modal');
  const addBtn = document.getElementById('add-mail-btn');
  const closeModal = document.getElementById('modal-close');

  // Gestion affichage expéditeur/destinataire
  document.getElementById('mail-type').addEventListener('change', function() {
    const isEntrant = this.value === 'entrant';
    document.getElementById('expediteur-group').style.display = isEntrant ? 'block' : 'none';
    document.getElementById('destinataire-group').style.display = isEntrant ? 'none' : 'block';
    
    // Mettre à jour la date
    const dateField = document.getElementById('mail-date');
    dateField.previousElementSibling.textContent = isEntrant ? 'Date réception' : 'Date envoi';
  });

  addBtn.onclick = () => {
    currentMail = null;
    document.getElementById('modal-title').textContent = 'Nouveau courrier';
    document.getElementById('mail-form').reset();
    document.getElementById('expediteur-group').style.display = 'block';
    document.getElementById('destinataire-group').style.display = 'none';
    modal.style.display = 'flex';
  };

  closeModal.onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  document.getElementById('mail-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('📤 Soumission du formulaire courrier...');
    
    const type = document.getElementById('mail-type').value;
    const mailData = {
      type: type,
      objet: document.getElementById('mail-objet').value,
      description: document.getElementById('mail-description').value,
      priority: document.getElementById('mail-priority').value,
      status: document.getElementById('mail-status').value,
      category: document.getElementById('mail-category').value,
      notes: document.getElementById('mail-notes').value
    };

    // Ajouter date et contact selon le type
    if (type === 'entrant') {
      mailData.date_reception = document.getElementById('mail-date').value;
      mailData.expediteur = document.getElementById('mail-expediteur').value;
    } else {
      mailData.date_envoi = document.getElementById('mail-date').value;
      mailData.destinataire = document.getElementById('mail-destinataire').value;
    }

    try {
      if (currentMail) {
        // Modifier
        console.log('✏️ Modification du courrier', currentMail.id);
        const { error } = await supabaseClient
          .from('courrier')
          .update(mailData)
          .eq('id', currentMail.id);
        
        if (error) throw error;
        console.log('✅ Courrier modifié');
      } else {
        // Ajouter (la référence sera générée par le trigger)
        console.log('➕ Ajout d\'un nouveau courrier');
        const { error } = await supabaseClient
          .from('courrier')
          .insert([mailData]);
        
        if (error) throw error;
        console.log('✅ Courrier ajouté');
      }
      
      modal.style.display = 'none';
      await loadMails();
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      alert('Erreur lors de l\'enregistrement: ' + err.message);
    }
  });

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────
  window.viewMail = function(id) {
    const mail = mails.find(m => m.id === id);
    if (!mail) return;

    document.getElementById('view-modal-title').textContent = mail.objet;
    
    const body = document.getElementById('view-modal-body');
    body.innerHTML = `
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Référence</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${mail.reference || 'Auto-générée'}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Type</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${mail.type === 'entrant' ? '📥 Entrant' : '📤 Sortant'}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">${mail.type === 'entrant' ? 'Expéditeur' : 'Destinataire'}</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${mail.type === 'entrant' ? (mail.expediteur || '-') : (mail.destinataire || '-')}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Date</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${mail.type === 'entrant' ? (mail.date_reception ? new Date(mail.date_reception).toLocaleDateString('fr-FR') : '-') : (mail.date_envoi ? new Date(mail.date_envoi).toLocaleDateString('fr-FR') : '-')}</p>
      </div>
      <div style="grid-column: 1 / -1;">
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Description</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${mail.description || 'Aucune description'}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Priorité</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${getPriorityLabel(mail.priority)}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Statut</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${getStatusLabel(mail.status)}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Catégorie</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${getCategoryLabel(mail.category) || '-'}</p>
      </div>
      ${mail.notes ? `
      <div style="grid-column: 1 / -1;">
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Notes</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${mail.notes}</p>
      </div>` : ''}
    `;

    currentMail = mail;
    document.getElementById('view-mail-modal').style.display = 'flex';
    lucide.createIcons();
  };

  window.editMail = function(id) {
    const mail = mails.find(m => m.id === id);
    if (!mail) return;

    currentMail = mail;
    document.getElementById('modal-title').textContent = 'Modifier le courrier';
    document.getElementById('mail-type').value = mail.type;
    
    // Afficher les bons champs
    const isEntrant = mail.type === 'entrant';
    document.getElementById('expediteur-group').style.display = isEntrant ? 'block' : 'none';
    document.getElementById('destinataire-group').style.display = isEntrant ? 'none' : 'block';
    
    if (isEntrant) {
      document.getElementById('mail-expediteur').value = mail.expediteur || '';
      document.getElementById('mail-date').value = mail.date_reception || '';
    } else {
      document.getElementById('mail-destinataire').value = mail.destinataire || '';
      document.getElementById('mail-date').value = mail.date_envoi || '';
    }
    
    document.getElementById('mail-objet').value = mail.objet;
    document.getElementById('mail-description').value = mail.description || '';
    document.getElementById('mail-priority').value = mail.priority;
    document.getElementById('mail-status').value = mail.status;
    document.getElementById('mail-category').value = mail.category || '';
    document.getElementById('mail-notes').value = mail.notes || '';
    
    modal.style.display = 'flex';
  };

  window.deleteMail = async function(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce courrier ?')) return;

    try {
      console.log('🗑️ Suppression du courrier', id);
      const { error } = await supabaseClient
        .from('courrier')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log('✅ Courrier supprimé');
      await loadMails();
      
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      alert('Erreur lors de la suppression: ' + err.message);
    }
  };

  window.editMailFromView = function() {
    document.getElementById('view-mail-modal').style.display = 'none';
    window.editMail(currentMail.id);
  };

  window.deleteMailFromView = function() {
    document.getElementById('view-mail-modal').style.display = 'none';
    window.deleteMail(currentMail.id);
  };

  // Fermer modal view
  document.getElementById('modal-view-close').onclick = () => {
    document.getElementById('view-mail-modal').style.display = 'none';
  };

  // ─────────────────────────────────────────────
  // INITIALISATION
  // ─────────────────────────────────────────────
  console.log('🎯 Chargement des courriers...');
  loadMails();
}