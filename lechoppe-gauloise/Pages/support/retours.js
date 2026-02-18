/**
 * PAGE RETOURS & REMBOURSEMENTS - L'Échoppe Gauloise
 * Gestion interactive de la page retours
 */

(function() {
  'use strict';

  // Variables globales
  let uploadedFiles = [];

  // Initialisation
  function initRetoursPage() {
    console.log('📦 Initialisation de la page Retours & Remboursements');
    
    // Initialiser Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Initialiser la navigation par type de client
    initTypeNavigation();
    
    // Initialiser l'accordéon des conditions
    initConditionsAccordion();
    
    // Initialiser le formulaire de retour
    initReturnForm();
    
    // Initialiser les boutons de quantité
    initQuantityButtons();
    
    // Initialiser le bouton de signalement de casse
    initBreakageReport();
    
    console.log('✅ Page Retours initialisée');
  }

  // ============================================
  // NAVIGATION PAR TYPE DE CLIENT
  // ============================================
  function initTypeNavigation() {
    const navButtons = document.querySelectorAll('.type-nav-btn');
    const sections = document.querySelectorAll('.client-section');
    
    navButtons.forEach(button => {
      button.addEventListener('click', function() {
        const type = this.dataset.type;
        
        // Mettre à jour les boutons actifs
        navButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Afficher la section correspondante
        sections.forEach(section => {
          section.classList.remove('active');
          if (section.id === `section-${type}`) {
            section.classList.add('active');
          }
        });
        
        // Faire défiler vers la section
        document.getElementById(`section-${type}`).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    });
  }

  // ============================================
  // ACCORDÉON DES CONDITIONS
  // ============================================
  function initConditionsAccordion() {
    const conditionQuestions = document.querySelectorAll('.condition-question');
    
    conditionQuestions.forEach(question => {
      question.addEventListener('click', toggleCondition);
    });
    
    // Ouvrir la première condition
    const firstCondition = document.querySelector('.condition-item');
    if (firstCondition) {
      firstCondition.classList.add('active');
    }
  }

  function toggleCondition(e) {
    const button = e.currentTarget;
    const conditionItem = button.closest('.condition-item');
    const isActive = conditionItem.classList.contains('active');
    
    // Fermer toutes les autres conditions
    if (!isActive) {
      document.querySelectorAll('.condition-item.active').forEach(item => {
        item.classList.remove('active');
      });
    }
    
    // Basculer l'état de la condition courante
    conditionItem.classList.toggle('active');
  }

  // ============================================
  // FORMULAIRE DE RETOUR
  // ============================================
  function initReturnForm() {
    const form = document.getElementById('returnRequestForm');
    const uploadArea = document.getElementById('uploadArea');
    const fileUpload = document.getElementById('fileUpload');
    const browseButton = document.getElementById('browseFiles');
    const fileList = document.getElementById('fileList');
    
    if (!form) return;
    
    // Gérer le drag and drop
    if (uploadArea) {
      // Empêcher le comportement par défaut
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
      });
      
      // Highlight de la zone de drop
      ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
      });
      
      // Gérer le drop
      uploadArea.addEventListener('drop', handleDrop, false);
      
      // Gérer le clic sur le bouton parcourir
      if (browseButton) {
        browseButton.addEventListener('click', function(e) {
          e.preventDefault();
          fileUpload.click();
        });
      }
      
      // Gérer la sélection de fichiers
      if (fileUpload) {
        fileUpload.addEventListener('change', handleFileSelect);
      }
    }
    
    // Soumission du formulaire
    form.addEventListener('submit', handleFormSubmit);
    
    // Réinitialisation du formulaire
    form.addEventListener('reset', handleFormReset);
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
      uploadArea.classList.add('dragover');
    }
  }

  function unhighlight() {
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
      uploadArea.classList.remove('dragover');
    }
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
  }

  function handleFiles(files) {
    const fileList = document.getElementById('fileList');
    
    [...files].forEach(file => {
      if (isValidFile(file)) {
        uploadedFiles.push(file);
        addFileToList(file);
      }
    });
    
    // Mettre à jour l'input file
    updateFileInput();
  }

  function isValidFile(file) {
    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError(`Le fichier ${file.name} dépasse 10MB`);
      return false;
    }
    
    // Vérifier le type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      showError(`Le type de fichier ${file.name} n'est pas supporté`);
      return false;
    }
    
    // Vérifier le nombre maximum de fichiers
    if (uploadedFiles.length >= 5) {
      showError('Maximum 5 fichiers autorisés');
      return false;
    }
    
    return true;
  }

  function addFileToList(file) {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    
    const fileId = Date.now() + Math.random();
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.id = fileId;
    
    const fileSize = formatFileSize(file.size);
    
    fileItem.innerHTML = `
      <div class="file-info">
        <i data-lucide="file" class="file-icon" size="16"></i>
        <div>
          <div class="file-name">${file.name}</div>
          <div class="file-size">${fileSize}</div>
        </div>
      </div>
      <button type="button" class="file-remove" data-file-id="${fileId}">
        <i data-lucide="trash-2" size="16"></i>
      </button>
    `;
    
    fileList.appendChild(fileItem);
    
    // Recréer les icônes Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Ajouter l'événement de suppression
    const removeButton = fileItem.querySelector('.file-remove');
    if (removeButton) {
      removeButton.addEventListener('click', function() {
        removeFile(fileId);
      });
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function removeFile(fileId) {
    // Retirer du tableau
    uploadedFiles = uploadedFiles.filter((_, index) => {
      const itemId = document.querySelectorAll('.file-item')[index]?.dataset.id;
      return itemId !== fileId.toString();
    });
    
    // Retirer de l'interface
    const fileItem = document.querySelector(`.file-item[data-id="${fileId}"]`);
    if (fileItem) {
      fileItem.remove();
    }
    
    // Mettre à jour l'input file
    updateFileInput();
  }

  function updateFileInput() {
    // Dans une vraie implémentation, on mettrait à jour un input type="file" multiple
    // Pour cette démo, on stocke juste dans uploadedFiles
    console.log('Fichiers uploadés:', uploadedFiles);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Ajouter les fichiers
    uploadedFiles.forEach(file => {
      formData.append('attachments', file);
    });
    
    // Validation simple
    if (!validateForm(formData)) {
      return;
    }
    
    // Simulation d'envoi
    showLoading(true);
    
    setTimeout(() => {
      showLoading(false);
      showSuccessMessage();
      form.reset();
      clearUploadedFiles();
    }, 2000);
  }

  function validateForm(formData) {
    // Vérifier l'acceptation des conditions
    const acceptTerms = document.getElementById('acceptTerms');
    if (!acceptTerms || !acceptTerms.checked) {
      showError('Vous devez accepter les conditions générales');
      acceptTerms.focus();
      return false;
    }
    
    // Autres validations ici...
    return true;
  }

  function handleFormReset() {
    clearUploadedFiles();
  }

  function clearUploadedFiles() {
    uploadedFiles = [];
    const fileList = document.getElementById('fileList');
    if (fileList) {
      fileList.innerHTML = '';
    }
    const fileUpload = document.getElementById('fileUpload');
    if (fileUpload) {
      fileUpload.value = '';
    }
  }

  // ============================================
  // BOUTONS DE QUANTITÉ
  // ============================================
  function initQuantityButtons() {
    // Boutons de quantité dans le formulaire
    const decreaseProduct = document.getElementById('decreaseProduct');
    const increaseProduct = document.getElementById('increaseProduct');
    const productCount = document.getElementById('productCount');
    
    if (decreaseProduct && increaseProduct && productCount) {
      decreaseProduct.addEventListener('click', () => {
        const currentValue = parseInt(productCount.value) || 1;
        if (currentValue > 1) {
          productCount.value = currentValue - 1;
        }
      });
      
      increaseProduct.addEventListener('click', () => {
        const currentValue = parseInt(productCount.value) || 1;
        if (currentValue < 100) {
          productCount.value = currentValue + 1;
        }
      });
      
      productCount.addEventListener('change', function() {
        let value = parseInt(this.value) || 1;
        if (value < 1) value = 1;
        if (value > 100) value = 100;
        this.value = value;
      });
    }
  }

  // ============================================
  // SIGNALEMENT DE CASSE
  // ============================================
  function initBreakageReport() {
    const reportButton = document.getElementById('reportBreakage');
    
    if (reportButton) {
      reportButton.addEventListener('click', function() {
        // Rediriger vers le formulaire de retour avec pré-remplissage
        document.querySelectorAll('.type-nav-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.dataset.type === 'particuliers') {
            btn.classList.add('active');
          }
        });
        
        document.querySelectorAll('.client-section').forEach(section => {
          section.classList.remove('active');
          if (section.id === 'section-particuliers') {
            section.classList.add('active');
          }
        });
        
        // Faire défiler vers le formulaire
        document.getElementById('contact').scrollIntoView({
          behavior: 'smooth'
        });
        
        // Pré-remplir le formulaire
        setTimeout(() => {
          const returnReason = document.getElementById('returnReason');
          if (returnReason) {
            returnReason.value = 'damaged';
          }
          
          const details = document.getElementById('returnDetails');
          if (details) {
            details.value = 'Je souhaite signaler des bouteilles cassées lors de la livraison.';
          }
          
          showNotification('Le formulaire a été pré-rempli pour un signalement de casse.', 'info');
        }, 500);
      });
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  function showLoading(show) {
    const submitButton = document.querySelector('#returnRequestForm button[type="submit"]');
    
    if (show) {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Envoi en cours...';
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    } else {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i data-lucide="send" size="18"></i> Envoyer la demande';
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    }
  }

  function showSuccessMessage() {
    // Créer une notification de succès
    const successMessage = document.createElement('div');
    successMessage.className = 'return-success';
    successMessage.innerHTML = `
      <i data-lucide="check-circle" size="20"></i>
      <div>
        <strong>Demande envoyée avec succès !</strong>
        <p>Nous vous répondrons sous 24 heures ouvrées.</p>
      </div>
    `;
    
    successMessage.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: var(--space-4) var(--space-6);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(successMessage);
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    setTimeout(() => {
      successMessage.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => successMessage.remove(), 300);
    }, 5000);
  }

  function showError(message) {
    // Créer une notification d'erreur
    const errorMessage = document.createElement('div');
    errorMessage.className = 'notification error';
    errorMessage.innerHTML = `
      <i data-lucide="alert-circle" size="20"></i>
      <span>${message}</span>
    `;
    
    errorMessage.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--danger);
      color: white;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(errorMessage);
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    setTimeout(() => {
      errorMessage.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => errorMessage.remove(), 300);
    }, 3000);
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i data-lucide="${getNotificationIcon(type)}" size="20"></i>
      <span>${message}</span>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${getNotificationColor(type)};
      color: white;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }

  function getNotificationColor(type) {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return 'var(--primary)';
    }
  }

  // ============================================
  // EXPORT DES FONCTIONNALITÉS
  // ============================================
  function openReturnForm(prefillData = {}) {
    // Ouvrir le formulaire avec des données pré-remplies
    document.querySelectorAll('.type-nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.type === 'particuliers') {
        btn.classList.add('active');
      }
    });
    
    document.querySelectorAll('.client-section').forEach(section => {
      section.classList.remove('active');
      if (section.id === 'section-particuliers') {
        section.classList.add('active');
      }
    });
    
    // Faire défiler vers le formulaire
    document.getElementById('contact').scrollIntoView({
      behavior: 'smooth'
    });
    
    // Pré-remplir les champs si des données sont fournies
    setTimeout(() => {
      if (prefillData.orderNumber) {
        const orderInput = document.getElementById('orderNumber');
        if (orderInput) orderInput.value = prefillData.orderNumber;
      }
      
      if (prefillData.reason) {
        const reasonSelect = document.getElementById('returnReason');
        if (reasonSelect) reasonSelect.value = prefillData.reason;
      }
      
      if (prefillData.details) {
        const detailsInput = document.getElementById('returnDetails');
        if (detailsInput) detailsInput.value = prefillData.details;
      }
      
      showNotification('Le formulaire a été pré-rempli avec vos informations.', 'info');
    }, 500);
  }

  // ============================================
  // INITIALISATION
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRetoursPage);
  } else {
    initRetoursPage();
  }

  // Exposer les fonctions globalement
  window.RetoursModule = {
    init: initRetoursPage,
    openReturnForm: openReturnForm,
    showNotification: showNotification,
    clearUploadedFiles: clearUploadedFiles
  };

  console.log(`

    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                    ║
    ║                    📦 RETOURS & REMBOURSEMENTS - L'Échoppe Gauloise 🍷            ║
    ║                                                                                    ║
    ║          Politique de retour complète | Formulaire intelligent | Conditions        ║ 
    ║               Développé par Rodulfo DOMINGUEZ                                      ║
    ║                                                                                    ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝

  `);

})();