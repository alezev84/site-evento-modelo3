// ========================================
// MOBILE NAVIGATION TOGGLE
// ========================================
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    
    // Acessibilidade: atualizar aria-expanded
    const isExpanded = navMenu.classList.contains('active');
    navToggle.setAttribute('aria-expanded', isExpanded);
    
    // Mudar ícone do botão
    navToggle.textContent = isExpanded ? '✕' : '☰';
  });
  
  // Fechar menu ao clicar em um link (mobile)
  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.textContent = '☰';
      }
    });
  });
  
  // Fechar menu ao clicar fora (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.textContent = '☰';
      }
    }
  });
}

// ========================================
// CAROUSEL FUNCTIONALITY
// ========================================
class Carousel {
  constructor() {
    this.track = document.getElementById('carouselTrack');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.indicatorsContainer = document.getElementById('carouselIndicators');
    
    if (!this.track) return;
    
    this.slides = Array.from(this.track.children);
    this.currentIndex = 0;
    this.autoplayInterval = null;
    this.autoplayDelay = 5000; // 5 segundos
    
    this.init();
  }
  
  init() {
    // Criar indicadores
    this.createIndicators();
    
    // Event listeners para botões
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }
    
    // Event listeners para indicadores
    this.indicators = Array.from(this.indicatorsContainer.children);
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goToSlide(index));
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });
    
    // Touch/swipe support
    this.addSwipeSupport();
    
    // Pausar autoplay ao hover
    this.track.addEventListener('mouseenter', () => this.pauseAutoplay());
    this.track.addEventListener('mouseleave', () => this.startAutoplay());
    
    // Iniciar autoplay
    this.startAutoplay();
    
    // Atualizar ao redimensionar (para mobile)
    window.addEventListener('resize', () => this.updateCarousel());
  }
  
  createIndicators() {
    this.slides.forEach((_, index) => {
      const indicator = document.createElement('button');
      indicator.classList.add('carousel-indicator');
      indicator.setAttribute('aria-label', `Ir para slide ${index + 1}`);
      
      if (index === 0) {
        indicator.classList.add('active');
      }
      
      this.indicatorsContainer.appendChild(indicator);
    });
  }
  
  goToSlide(index) {
    // Garantir que o índice está dentro dos limites
    if (index < 0) {
      this.currentIndex = this.slides.length - 1;
    } else if (index >= this.slides.length) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = index;
    }
    
    this.updateCarousel();
  }
  
  updateCarousel() {
    // Mover o track
    const offset = -this.currentIndex * 100;
    this.track.style.transform = `translateX(${offset}%)`;
    
    // Atualizar indicadores
    this.indicators.forEach((indicator, index) => {
      if (index === this.currentIndex) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
    
    // Atualizar aria-live para leitores de tela
    const currentSlide = this.slides[this.currentIndex];
    const img = currentSlide.querySelector('img');
    if (img) {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.classList.add('sr-only'); // Visually hidden
      announcement.textContent = `Slide ${this.currentIndex + 1} de ${this.slides.length}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => announcement.remove(), 1000);
    }
  }
  
  next() {
    this.goToSlide(this.currentIndex + 1);
    this.resetAutoplay();
  }
  
  prev() {
    this.goToSlide(this.currentIndex - 1);
    this.resetAutoplay();
  }
  
  startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      this.next();
    }, this.autoplayDelay);
  }
  
  pauseAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }
  
  resetAutoplay() {
    this.pauseAutoplay();
    this.startAutoplay();
  }
  
  addSwipeSupport() {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    this.track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      this.pauseAutoplay();
    });
    
    this.track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
    });
    
    this.track.addEventListener('touchend', () => {
      if (!isDragging) return;
      
      const diff = startX - currentX;
      const threshold = 50; // Mínimo de pixels para considerar swipe
      
      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }
      
      isDragging = false;
      this.startAutoplay();
    });
    
    // Mouse drag support (desktop)
    let mouseDown = false;
    let startMouseX = 0;
    
    this.track.addEventListener('mousedown', (e) => {
      mouseDown = true;
      startMouseX = e.clientX;
      this.track.style.cursor = 'grabbing';
      this.pauseAutoplay();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!mouseDown) return;
      currentX = e.clientX;
    });
    
    document.addEventListener('mouseup', () => {
      if (!mouseDown) return;
      
      const diff = startMouseX - currentX;
      const threshold = 50;
      
      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }
      
      mouseDown = false;
      this.track.style.cursor = 'grab';
      this.startAutoplay();
    });
  }
}

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Ignorar links que são apenas "#"
      if (href === '#') return;
      
      const target = document.querySelector(href);
      
      if (target) {
        e.preventDefault();
        
        const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
        const targetPosition = target.offsetTop - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ========================================
// LAZY LOADING DE IMAGENS
// ========================================
function initLazyLoading() {
  // Verificar se IntersectionObserver está disponível
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px' // Começar a carregar 50px antes de entrar na viewport
    });
    
    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback para navegadores antigos
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

// ========================================
// ACTIVE LINK HIGHLIGHT ON SCROLL
// ========================================
function initScrollSpy() {
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (sections.length === 0) return;
  
  function highlightNavLink() {
    const scrollPosition = window.scrollY + 100; // Offset
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  
  // Throttle para performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        highlightNavLink();
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ========================================
// ANIMATE ON SCROLL (fade in elements)
// ========================================
function initAnimateOnScroll() {
  if ('IntersectionObserver' in window) {
    const elements = document.querySelectorAll('.card, .president-content, .venue-content, .speaker-card');
    
    const animateObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(30px)';
          entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);
          
          animateObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(el => animateObserver.observe(el));
  }
}

// ========================================
// BACK TO TOP BUTTON
// ========================================
function initBackToTop() {
  // Criar botão se não existir
  let backToTopBtn = document.getElementById('backToTop');
  
  if (!backToTopBtn) {
    backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'backToTop';
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.setAttribute('aria-label', 'Voltar ao topo');
    backToTopBtn.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 50px;
      height: 50px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    document.body.appendChild(backToTopBtn);
  }
  
  // Mostrar/ocultar botão baseado no scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.style.opacity = '1';
      backToTopBtn.style.visibility = 'visible';
    } else {
      backToTopBtn.style.opacity = '0';
      backToTopBtn.style.visibility = 'hidden';
    }
  });
  
  // Scroll to top ao clicar
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // Hover effect
  backToTopBtn.addEventListener('mouseenter', () => {
    backToTopBtn.style.transform = 'scale(1.1)';
  });
  
  backToTopBtn.addEventListener('mouseleave', () => {
    backToTopBtn.style.transform = 'scale(1)';
  });
}

// ========================================
// INIT ALL FUNCTIONS ON DOM LOADED
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar carousel
  new Carousel();
  
  // Inicializar outras funcionalidades
  initSmoothScroll();
  initLazyLoading();
  initScrollSpy();
  initAnimateOnScroll();
  initBackToTop();
  
  console.log('✅ Site carregado com sucesso!');
});

// ========================================
// PERFORMANCE: Preload critical images
// ========================================
window.addEventListener('load', () => {
  // Exemplo: preload de imagens importantes
  const criticalImages = [
    // Adicionar URLs de imagens críticas aqui se necessário
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
});