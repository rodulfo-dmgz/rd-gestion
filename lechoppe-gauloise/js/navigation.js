/**
 * ═══════════════════════════════════════════════════════════════════════════
 * L'ÉCHOPPE GAULOISE - NAVIGATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestion de la navigation sticky et du menu mobile
 */

const NavigationModule = (() => {
  'use strict';

  let lastScrollY = window.scrollY;
  let ticking = false;

  /**
   * Initialize navigation
   */
  function init() {
    setupStickyHeader();
    setupMobileMenu();
    setupSmoothScroll();
  }

  /**
   * Setup sticky header with hide/show on scroll
   */
  function setupStickyHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Hide header when scrolling down, show when scrolling up
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add('header--hidden');
          } else {
            header.classList.remove('header--hidden');
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', Utils.throttle(handleScroll, 100));
  }

  /**
   * Setup mobile menu toggle
   */
  function setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navList = document.getElementById('navList');

    if (!menuBtn || !navList) return;

    menuBtn.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('nav__list--open');
      menuBtn.classList.toggle('mobile-menu-btn--active');
      menuBtn.setAttribute('aria-expanded', isOpen);

      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when clicking on a link
    const navLinks = navList.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('nav__list--open');
        menuBtn.classList.remove('mobile-menu-btn--active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !navList.contains(e.target)) {
        navList.classList.remove('nav__list--open');
        menuBtn.classList.remove('mobile-menu-btn--active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /**
   * Setup smooth scrolling for anchor links
   */
  function setupSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#' || href === '#!') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerHeight = document.getElementById('header')?.offsetHeight || 80;
          Utils.scrollToElement(target, headerHeight + 20);
        }
      });
    });
  }

  

  // Public API
  return {
    init
  };
})();