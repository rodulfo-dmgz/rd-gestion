// =============================================
// MODULE AGENDA - GESTION RENDEZ-VOUS
// VERSION GITHUB PAGES - DEBUGGÉE
// =============================================

console.log('📍 agenda.js chargé');
console.log('🔍 window.supabase existe?', typeof window.supabase !== 'undefined');
console.log('🔍 window.supabaseClient existe?', typeof window.supabaseClient !== 'undefined');

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgenda);
} else {
  initAgenda();
}

function initAgenda() {
  console.log('🚀 Initialisation du module Agenda');
  
  // Vérifier que Supabase est bien chargé
  if (typeof window.supabase === 'undefined' && typeof window.supabaseClient === 'undefined') {
    console.error('❌ ERREUR CRITIQUE: Supabase n\'est pas défini !');
    alert('Erreur: Configuration Supabase manquante.');
    return;
  }

  // Utiliser window.supabase (le client)
  const supabaseClient = window.supabase || window.supabaseClient;
  
  console.log('✅ Client Supabase:', supabaseClient);
  console.log('✅ Méthode .from disponible:', typeof supabaseClient?.from);

  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    console.error('❌ Client Supabase invalide');
    console.error('Type:', typeof supabaseClient);
    console.error('Objet:', supabaseClient);
    alert('Erreur: Client Supabase invalide');
    return;
  }

  // Vérification utilisateur
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    console.warn('⚠️ Aucun utilisateur connecté, redirection...');
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
  let events = [];
  let currentEvent = null;
  let currentDate = new Date();
  let selectedDate = null;
  let activeFilters = {
    types: ['meeting', 'call', 'event', 'appointment'],
    statuses: ['confirmed', 'pending']
  };

  // ─────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────
  function generateNavigation() {
    const nav = document.getElementById("sidebar-nav");
    nav.innerHTML = '';

    const saDashboard = document.createElement("a");
    saDashboard.href = "../index-sa.html";
    saDashboard.innerHTML = '<i data-lucide="layout-grid"></i> Dashboard';
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
  // CHARGEMENT ÉVÉNEMENTS DEPUIS SUPABASE
  // ─────────────────────────────────────────────
  async function loadEvents() {
    try {
      console.log('📥 Chargement des événements depuis Supabase...');
      
      const { data, error } = await supabaseClient
        .from('agenda')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      events = data || [];
      console.log('✅ Événements chargés:', events.length);
      
      renderCalendar();
      renderEvents();
      
    } catch (err) {
      console.error("❌ Erreur chargement événements:", err);
      events = [];
      renderCalendar();
      renderEvents();
    }
  }

  // ─────────────────────────────────────────────
  // RENDU CALENDRIER
  // ─────────────────────────────────────────────
  function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    // Headers jours
    const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    dayNames.forEach(day => {
      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.textContent = day;
      grid.appendChild(header);
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Mettre à jour le titre du mois
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

    // Premier jour du mois (0 = dimanche)
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Convertir dimanche (0) en lundi (1)
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    // Jours du mois précédent
    for (let i = startDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dayEl = createDayElement(day, month - 1, year, true);
      grid.appendChild(dayEl);
    }

    // Jours du mois actuel
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasEvents = events.some(e => e.start_date === dateStr);
      
      const dayEl = createDayElement(day, month, year, false, isToday, hasEvents);
      grid.appendChild(dayEl);
    }

    // Jours du mois suivant pour compléter la grille
    const totalCells = grid.children.length - 7; // -7 pour les headers
    const remainingCells = 42 - totalCells - 7;
    for (let day = 1; day <= remainingCells; day++) {
      const dayEl = createDayElement(day, month + 1, year, true);
      grid.appendChild(dayEl);
    }

    lucide.createIcons();
  }

  function createDayElement(day, month, year, otherMonth = false, isToday = false, hasEvents = false) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;
    
    if (otherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    if (hasEvents) dayEl.classList.add('has-events');
    
    dayEl.onclick = () => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      selectedDate = dateStr;
      filterEventsByDate(dateStr);
    };
    
    return dayEl;
  }

  // Navigation mois
  document.getElementById('prev-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  };

  document.getElementById('next-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  };

  // ─────────────────────────────────────────────
  // RENDU LISTE ÉVÉNEMENTS
  // ─────────────────────────────────────────────
  function renderEvents() {
    const container = document.getElementById('events-container');
    container.innerHTML = '';

    let filteredEvents = events.filter(event => {
      return activeFilters.types.includes(event.type) && 
             activeFilters.statuses.includes(event.status);
    });

    // Filtrer par recherche
    const searchTerm = document.getElementById('search-event').value.toLowerCase();
    if (searchTerm) {
      filteredEvents = filteredEvents.filter(e => 
        e.title.toLowerCase().includes(searchTerm) ||
        (e.description && e.description.toLowerCase().includes(searchTerm))
      );
    }

    // Filtrer par date sélectionnée
    if (selectedDate) {
      filteredEvents = filteredEvents.filter(e => e.start_date === selectedDate);
    }

    // Filtrer les événements futurs
    const today = new Date().toISOString().slice(0, 10);
    filteredEvents = filteredEvents.filter(e => e.start_date >= today);

    if (filteredEvents.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 3rem;">Aucun rendez-vous trouvé</p>';
      return;
    }

    filteredEvents.forEach(event => {
      const item = document.createElement('div');
      item.className = `event-item priority-${event.priority}`;
      
      const date = new Date(event.start_date);
      const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      
      item.innerHTML = `
        <div class="event-time">
          <div class="day">${date.getDate()}</div>
          <div class="month">${date.toLocaleDateString('fr-FR', { month: 'short' })}</div>
          <div class="time">${event.start_time || '--:--'}</div>
        </div>
        <div class="event-content">
          <div class="event-header">
            <h3 class="event-title">${event.title}</h3>
            <span class="event-type type-${event.type}">${getTypeLabel(event.type)}</span>
          </div>
          <p class="event-description">${event.description || 'Pas de description'}</p>
          <div class="event-meta">
            ${event.location ? `<span><i data-lucide="map-pin"></i> ${event.location}</span>` : ''}
            <span><i data-lucide="clock"></i> ${event.start_time || 'Heure non définie'}</span>
            <span><i data-lucide="circle"></i> ${getStatusLabel(event.status)}</span>
          </div>
        </div>
        <div class="event-actions">
          <button onclick="viewEvent(${event.id})" title="Voir détails">
            <i data-lucide="eye"></i>
          </button>
          <button onclick="editEvent(${event.id})" title="Modifier">
            <i data-lucide="edit"></i>
          </button>
          <button onclick="deleteEvent(${event.id})" title="Supprimer">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      
      container.appendChild(item);
    });

    lucide.createIcons();
  }

  function getTypeLabel(type) {
    const labels = {
      'meeting': 'Réunion',
      'call': 'Appel',
      'event': 'Événement',
      'appointment': 'RDV'
    };
    return labels[type] || type;
  }

  function getStatusLabel(status) {
    const labels = {
      'confirmed': 'Confirmé',
      'pending': 'En attente',
      'cancelled': 'Annulé'
    };
    return labels[status] || status;
  }

  // ─────────────────────────────────────────────
  // FILTRES
  // ─────────────────────────────────────────────
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const filterType = this.value;
      const isType = ['meeting', 'call', 'event', 'appointment'].includes(filterType);
      
      if (isType) {
        if (this.checked) {
          activeFilters.types.push(filterType);
        } else {
          activeFilters.types = activeFilters.types.filter(t => t !== filterType);
        }
      } else {
        if (this.checked) {
          activeFilters.statuses.push(filterType);
        } else {
          activeFilters.statuses = activeFilters.statuses.filter(s => s !== filterType);
        }
      }
      
      renderEvents();
    });
  });

  function filterEventsByDate(dateStr) {
    selectedDate = dateStr;
    renderEvents();
  }

  // Recherche
  document.getElementById('search-event').addEventListener('input', () => {
    renderEvents();
  });

  // ─────────────────────────────────────────────
  // MODAL AJOUTER/MODIFIER
  // ─────────────────────────────────────────────
  const modal = document.getElementById('event-modal');
  const addBtn = document.getElementById('add-event-btn');
  const closeModal = document.getElementById('modal-close');

  addBtn.onclick = () => {
    currentEvent = null;
    document.getElementById('modal-title').textContent = 'Nouveau rendez-vous';
    document.getElementById('event-form').reset();
    modal.style.display = 'flex';
  };

  closeModal.onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('📤 Soumission du formulaire...');
    
    const eventData = {
      title: document.getElementById('event-title').value,
      description: document.getElementById('event-description').value,
      start_date: document.getElementById('event-date').value,
      start_time: document.getElementById('event-time').value,
      location: document.getElementById('event-location').value,
      type: document.getElementById('event-type').value,
      priority: document.getElementById('event-priority').value,
      status: document.getElementById('event-status').value,
      created_by: user.id
    };

    console.log('📋 Données:', eventData);

    try {
      if (currentEvent) {
        // Modifier
        console.log('✏️ Modification de l\'événement', currentEvent.id);
        const { error } = await supabaseClient
          .from('agenda')
          .update(eventData)
          .eq('id', currentEvent.id);
        
        if (error) throw error;
        console.log('✅ Événement modifié');
      } else {
        // Ajouter
        console.log('➕ Ajout d\'un nouvel événement');
        const { error } = await supabaseClient
          .from('agenda')
          .insert([eventData]);
        
        if (error) throw error;
        console.log('✅ Événement ajouté');
      }
      
      modal.style.display = 'none';
      await loadEvents();
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      alert('Erreur lors de l\'enregistrement: ' + err.message);
    }
  });

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────
  window.viewEvent = function(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    document.getElementById('view-modal-title').textContent = event.title;
    
    const body = document.getElementById('view-modal-body');
    body.innerHTML = `
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Date</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${new Date(event.start_date).toLocaleDateString('fr-FR')}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Heure</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${event.start_time || 'Non définie'}</p>
      </div>
      <div style="grid-column: 1 / -1;">
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Description</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${event.description || 'Aucune description'}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Type</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${getTypeLabel(event.type)}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Statut</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${getStatusLabel(event.status)}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Priorité</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${event.priority}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Lieu</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${event.location || 'Non spécifié'}</p>
      </div>
    `;

    currentEvent = event;
    document.getElementById('view-event-modal').style.display = 'flex';
    lucide.createIcons();
  };

  window.editEvent = function(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    currentEvent = event;
    document.getElementById('modal-title').textContent = 'Modifier le rendez-vous';
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-description').value = event.description || '';
    document.getElementById('event-date').value = event.start_date;
    document.getElementById('event-time').value = event.start_time || '';
    document.getElementById('event-location').value = event.location || '';
    document.getElementById('event-type').value = event.type;
    document.getElementById('event-priority').value = event.priority;
    document.getElementById('event-status').value = event.status;
    
    modal.style.display = 'flex';
  };

  window.deleteEvent = async function(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) return;

    try {
      console.log('🗑️ Suppression de l\'événement', id);
      const { error } = await supabaseClient
        .from('agenda')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log('✅ Événement supprimé');
      await loadEvents();
      
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      alert('Erreur lors de la suppression: ' + err.message);
    }
  };

  window.editEventFromView = function() {
    document.getElementById('view-event-modal').style.display = 'none';
    window.editEvent(currentEvent.id);
  };

  window.deleteEventFromView = function() {
    document.getElementById('view-event-modal').style.display = 'none';
    window.deleteEvent(currentEvent.id);
  };

  // Fermer modal view
  document.getElementById('modal-view-close').onclick = () => {
    document.getElementById('view-event-modal').style.display = 'none';
  };

  // ─────────────────────────────────────────────
  // INITIALISATION
  // ─────────────────────────────────────────────
  console.log('🎯 Chargement des événements...');
  loadEvents();
}