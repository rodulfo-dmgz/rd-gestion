/**
 * PAGE FAQ - L'Échoppe Gauloise
 * Gestion de l'accordéon, recherche et filtrage
 */

(function() {
  'use strict';

  // État global
  let activeCategory = 'all';
  let searchQuery = '';

  // Initialisation
  function initFAQ() {
    console.log('📖 Initialisation de la FAQ');
    
    // Initialiser Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Initialiser l'accordéon
    initAccordion();
    
    // Initialiser la recherche
    initSearch();
    
    // Initialiser les filtres de catégories
    initCategoryFilters();
    
    // Initialiser le défilement vers les ancres
    initAnchorLinks();
    
    console.log('✅ FAQ initialisée');
  }

  // ============================================
  // ACCORDÉON INTERACTIF
  // ============================================
  function initAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
      question.addEventListener('click', toggleAccordion);
    });
    
    // Ouvrir la première question de chaque section non filtrée
    document.querySelectorAll('.faq-section:not(.filtered) .faq-item').forEach((item, index) => {
      if (index === 0) {
        item.classList.add('active');
      }
    });
  }

  function toggleAccordion(e) {
    const button = e.currentTarget;
    const faqItem = button.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');
    
    // Fermer toutes les autres questions
    if (!isActive) {
      document.querySelectorAll('.faq-item.active').forEach(item => {
        item.classList.remove('active');
      });
    }
    
    // Basculer l'état de la question courante
    faqItem.classList.toggle('active');
    
    // Ajouter une animation de highlight
    faqItem.classList.add('highlighted');
    setTimeout(() => {
      faqItem.classList.remove('highlighted');
    }, 2000);
  }

  // ============================================
  // RECHERCHE INTELLIGENTE
  // ============================================
  function initSearch() {
    const searchInput = document.getElementById('faqSearch');
    const clearButton = document.getElementById('clearSearch');
    
    if (!searchInput) return;
    
    // Recherche en temps réel
    searchInput.addEventListener('input', function(e) {
      searchQuery = e.target.value.toLowerCase().trim();
      performSearch();
      updateClearButton();
    });
    
    // Effacer la recherche
    if (clearButton) {
      clearButton.addEventListener('click', function() {
        searchInput.value = '';
        searchQuery = '';
        performSearch();
        updateClearButton();
        searchInput.focus();
      });
    }
    
    // Recherche par touche Entrée
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        highlightResults();
      }
    });
  }

  function performSearch() {
    const allItems = document.querySelectorAll('.faq-item');
    let hasResults = false;
    
    if (!searchQuery) {
      // Afficher tout
      allItems.forEach(item => {
        item.classList.remove('filtered');
        item.classList.remove('highlighted');
      });
      
      // Mettre à jour les sections
      updateSectionsVisibility();
      return;
    }
    
    // Rechercher dans les questions et réponses
    allItems.forEach(item => {
      const question = item.querySelector('.faq-question span').textContent.toLowerCase();
      const answer = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';
      const tags = item.dataset.tags?.toLowerCase() || '';
      
      const matches = question.includes(searchQuery) || 
                     answer.includes(searchQuery) || 
                     tags.includes(searchQuery);
      
      if (matches) {
        item.classList.remove('filtered');
        item.classList.add('highlighted');
        hasResults = true;
        
        // Mettre en évidence le texte correspondant
        highlightText(item, searchQuery);
      } else {
        item.classList.add('filtered');
        item.classList.remove('highlighted');
      }
    });
    
    // Mettre à jour les sections
    updateSectionsVisibility();
    
    // Afficher un message si aucun résultat
    showNoResultsMessage(!hasResults);
    
    // Fermer toutes les questions au début d'une nouvelle recherche
    if (searchQuery) {
      document.querySelectorAll('.faq-item.active').forEach(item => {
        item.classList.remove('active');
      });
    }
  }

  function highlightText(item, query) {
    const questionText = item.querySelector('.faq-question span');
    const answerText = item.querySelector('.faq-answer');
    
    if (!answerText) return;
    
    // Sauvegarder le texte original
    const originalQuestion = questionText.dataset.original || questionText.innerHTML;
    const originalAnswer = answerText.dataset.original || answerText.innerHTML;
    
    questionText.dataset.original = originalQuestion;
    answerText.dataset.original = originalAnswer;
    
    // Mettre en évidence (version simple)
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    const highlightedQuestion = originalQuestion.replace(regex, '<mark>$1</mark>');
    const highlightedAnswer = originalAnswer.replace(regex, '<mark>$1</mark>');
    
    questionText.innerHTML = highlightedQuestion;
    answerText.innerHTML = highlightedAnswer;
  }

  function highlightResults() {
    const highlightedItems = document.querySelectorAll('.faq-item:not(.filtered)');
    
    highlightedItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('highlighted');
        setTimeout(() => {
          item.classList.remove('highlighted');
        }, 1000);
      }, index * 100);
    });
  }

  function updateClearButton() {
    const clearButton = document.getElementById('clearSearch');
    if (clearButton) {
      clearButton.style.display = searchQuery ? 'flex' : 'none';
    }
  }

  function showNoResultsMessage(show) {
    let noResults = document.querySelector('.no-results');
    
    if (show && !noResults) {
      noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.innerHTML = `
        <i data-lucide="search-x" size="48"></i>
        <h3>Aucun résultat trouvé</h3>
        <p>Aucune question ne correspond à votre recherche "${searchQuery}". Essayez d'autres termes.</p>
        <button class="btn btn-secondary" id="clearSearchAll">
          <i data-lucide="x"></i>
          Effacer la recherche
        </button>
      `;
      
      const faqContainer = document.querySelector('.faq-container');
      faqContainer.appendChild(noResults);
      
      // Initialiser les icônes
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      // Bouton pour effacer la recherche
      document.getElementById('clearSearchAll')?.addEventListener('click', function() {
        document.getElementById('faqSearch').value = '';
        searchQuery = '';
        performSearch();
        updateClearButton();
        noResults.remove();
      });
    } else if (!show && noResults) {
      noResults.remove();
    }
  }

  // ============================================
  // FILTRES PAR CATÉGORIES
  // ============================================
  function initCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
      button.addEventListener('click', function() {
        const category = this.dataset.category;
        
        // Mettre à jour les boutons actifs
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Filtrer les questions
        filterByCategory(category);
      });
    });
  }

  function filterByCategory(category) {
    activeCategory = category;
    const allSections = document.querySelectorAll('.faq-section');
    
    if (category === 'all') {
      allSections.forEach(section => {
        section.classList.remove('filtered');
      });
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('filtered');
      });
    } else {
      allSections.forEach(section => {
        if (section.dataset.category === category) {
          section.classList.remove('filtered');
        } else {
          section.classList.add('filtered');
        }
      });
    }
    
    // Mettre à jour la recherche si active
    if (searchQuery) {
      performSearch();
    }
    
    // Ouvrir la première question des sections visibles
    document.querySelectorAll('.faq-section:not(.filtered) .faq-item').forEach((item, index) => {
      if (index === 0) {
        item.classList.add('active');
      }
    });
  }

  function updateSectionsVisibility() {
    const allSections = document.querySelectorAll('.faq-section');
    
    allSections.forEach(section => {
      const visibleItems = section.querySelectorAll('.faq-item:not(.filtered)');
      
      if (visibleItems.length === 0 && activeCategory === 'all') {
        section.classList.add('filtered');
      } else {
        section.classList.remove('filtered');
      }
    });
  }

  // ============================================
  // GESTION DES ANCRES
  // ============================================
  function initAnchorLinks() {
    // Si l'URL contient une ancre, ouvrir la question correspondante
    const hash = window.location.hash;
    if (hash) {
      const targetElement = document.querySelector(hash);
      if (targetElement && targetElement.classList.contains('faq-item')) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth' });
          targetElement.classList.add('active');
          targetElement.classList.add('highlighted');
        }, 500);
      }
    }
    
    // Gérer les clics sur les liens internes
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#') && href.length > 1) {
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement && targetElement.classList.contains('faq-item')) {
            e.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });
            
            // Ouvrir la question
            document.querySelectorAll('.faq-item.active').forEach(item => {
              item.classList.remove('active');
            });
            targetElement.classList.add('active');
            targetElement.classList.add('highlighted');
            
            // Mettre à jour l'URL sans recharger la page
            history.pushState(null, null, href);
          }
        }
      });
    });
  }

  // ============================================
  // EXPORT DES FONCTIONNALITÉS
  // ============================================
  function searchFAQ(query) {
    searchQuery = query.toLowerCase().trim();
    const searchInput = document.getElementById('faqSearch');
    if (searchInput) {
      searchInput.value = query;
    }
    performSearch();
    updateClearButton();
  }

  function openQuestion(questionId) {
    const question = document.getElementById(questionId);
    if (question) {
      document.querySelectorAll('.faq-item.active').forEach(item => {
        item.classList.remove('active');
      });
      question.classList.add('active');
      question.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ============================================
  // INITIALISATION
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFAQ);
  } else {
    initFAQ();
  }

  // Exposer les fonctions globalement
  window.FAQModule = {
    search: searchFAQ,
    openQuestion: openQuestion,
    filterByCategory: filterByCategory,
    init: initFAQ
  };

  console.log(`

    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                    ║
    ║                    ❓ FAQ INTERACTIVE - L'Échoppe Gauloise 🍷                     ║
    ║                                                                                    ║
    ║          Recherche intelligente, filtrage par catégorie et accordéon              ║ 
    ║               Développé par Rodulfo DOMINGUEZ                                      ║
    ║                                                                                    ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝

  `);

})();