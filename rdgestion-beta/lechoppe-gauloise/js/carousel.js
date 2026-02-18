/**
 * ═══════════════════════════════════════════════════════════════════════════
 * L'ÉCHOPPE GAULOISE - CAROUSEL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Carousel de produits avec navigation et support tactile
 */

const CarouselModule = (() => {
  'use strict';

  let currentSlide = 0;
  let totalSlides = 0;
  let track = null;
  let autoplayInterval = null;

  const config = {
    autoplay: true,
    autoplayDelay: 5000,
    slidesPerView: {
      mobile: 1,
      tablet: 2,
      desktop: 3
    }
  };

  /**
   * Initialize carousel
   */
  function init() {
    const carousel = document.getElementById('productsCarousel');
    if (!carousel) return;

    track = carousel.querySelector('#carouselTrack');
    const slides = track?.querySelectorAll('.carousel__slide');
    
    if (!track || !slides || slides.length === 0) return;

    totalSlides = slides.length;
    
    setupNavigation(carousel);
    setupDots(carousel);
    setupTouchGestures();
    updateCarousel();

    if (config.autoplay) {
      startAutoplay();
    }

    // Pause autoplay on hover
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', () => {
      if (config.autoplay) startAutoplay();
    });

    // Handle window resize
    window.addEventListener('resize', Utils.debounce(() => {
      updateCarousel();
    }, 250));
  }

  /**
   * Setup navigation buttons
   */
  function setupNavigation(carousel) {
    const prevBtn = carousel.querySelector('#carouselPrev');
    const nextBtn = carousel.querySelector('#carouselNext');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
        stopAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
        stopAutoplay();
      });
    }
  }

  /**
   * Setup dots indicators
   */
  function setupDots(carousel) {
    const dotsContainer = carousel.querySelector('#carouselDots');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';

    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', `Aller au produit ${i + 1}`);
      
      dot.addEventListener('click', () => {
        goToSlide(i);
        stopAutoplay();
      });

      dotsContainer.appendChild(dot);
    }

    updateDots();
  }

  /**
   * Setup touch gestures for mobile
   */
  function setupTouchGestures() {
    if (!track) return;

    let startX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });

    track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
    });

    track.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToSlide(currentSlide + 1);
        } else {
          goToSlide(currentSlide - 1);
        }
        stopAutoplay();
      }

      isDragging = false;
    });
  }

  /**
   * Go to specific slide
   */
  function goToSlide(index) {
    currentSlide = Utils.clamp(index, 0, totalSlides - 1);
    updateCarousel();
  }

  /**
   * Update carousel position and UI
   */
  function updateCarousel() {
    if (!track) return;

    const slidesPerView = getSlidesPerView();
    const slideWidth = track.offsetWidth / slidesPerView;
    const offset = -(currentSlide * slideWidth);

    track.style.transform = `translateX(${offset}px)`;
    updateDots();
  }

  /**
   * Get number of slides per view based on screen size
   */
  function getSlidesPerView() {
    const width = window.innerWidth;
    
    if (width >= 1024) {
      return config.slidesPerView.desktop;
    } else if (width >= 768) {
      return config.slidesPerView.tablet;
    } else {
      return config.slidesPerView.mobile;
    }
  }

  /**
   * Update dots active state
   */
  function updateDots() {
    const dots = document.querySelectorAll('.carousel__dot');
    dots.forEach((dot, index) => {
      if (index === currentSlide) {
        dot.classList.add('carousel__dot--active');
      } else {
        dot.classList.remove('carousel__dot--active');
      }
    });
  }

  /**
   * Start autoplay
   */
  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      const nextSlide = currentSlide + 1;
      goToSlide(nextSlide >= totalSlides ? 0 : nextSlide);
    }, config.autoplayDelay);
  }

  /**
   * Stop autoplay
   */
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  // Public API
  return {
    init,
    goToSlide
  };
})();