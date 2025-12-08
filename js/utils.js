// ========================================
// UTILS.JS - Funções Compartilhadas
// ========================================

// ========================================
// MODAL SYSTEM (Universal)
// ========================================
class Modal {
  constructor() {
    this.modal = null;
    this.init();
  }
  
  init() {
    // Criar estrutura do modal se não existir
    if (!document.getElementById('universalModal')) {
      this.createModalStructure();
    }
    this.modal = document.getElementById('universalModal');
    this.setupEventListeners();
  }
  
  createModalStructure() {
    const modalHTML = `
      <div id="universalModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal-overlay"></div>
        <div class="modal-container">
          <button class="modal-close" aria-label="Fechar modal">×</button>
          <div class="modal-content" id="modalContent">
            <!-- Conteúdo dinâmico -->
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Adicionar estilos do modal
    this.addModalStyles();
  }
  
  addModalStyles() {
    if (document.getElementById('modalStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'modalStyles';
    styles.textContent = `
      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        overflow-y: auto;
        padding: 20px;
      }
      
      .modal.active {
        display: block;
      }
      
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease;
      }
      
      .modal-container {
        position: relative;
        max-width: 900px;
        margin: 40px auto;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
        z-index: 10000;
      }
      
      .modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(0, 0, 0, 0.1);
        color: #333;
        font-size: 28px;
        line-height: 1;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 10001;
      }
      
      .modal-close:hover {
        background: rgba(0, 0, 0, 0.2);
        transform: rotate(90deg);
      }
      
      .modal-content {
        padding: 40px;
        max-height: calc(100vh - 120px);
        overflow-y: auto;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @media (max-width: 768px) {
        .modal {
          padding: 0;
        }
        
        .modal-container {
          margin: 0;
          border-radius: 0;
          min-height: 100vh;
        }
        
        .modal-content {
          padding: 60px 20px 20px;
        }
        
        .modal-close {
          top: 10px;
          right: 10px;
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  setupEventListeners() {
    // Fechar ao clicar no X
    const closeBtn = this.modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => this.close());
    
    // Fechar ao clicar no overlay
    const overlay = this.modal.querySelector('.modal-overlay');
    overlay.addEventListener('click', () => this.close());
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
  }
  
  open(content) {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = content;
    
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus no modal para acessibilidade
    this.modal.focus();
  }
  
  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Instância global do modal
const universalModal = new Modal();

// ========================================
// FETCH JSON com Cache
// ========================================
class JSONLoader {
  constructor() {
    this.cache = {};
  }
  
  async load(url, useCache = true) {
    // Verificar cache
    if (useCache && this.cache[url]) {
      console.log(`✅ Cache hit: ${url}`);
      return this.cache[url];
    }
    
    try {
      console.log(`🔄 Carregando: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Armazenar no cache
      this.cache[url] = data;
      
      console.log(`✅ Carregado: ${url}`);
      return data;
      
    } catch (error) {
      console.error(`❌ Erro ao carregar ${url}:`, error);
      throw error;
    }
  }
  
  clearCache(url = null) {
    if (url) {
      delete this.cache[url];
    } else {
      this.cache = {};
    }
  }
}

// Instância global do loader
const jsonLoader = new JSONLoader();

// ========================================
// DEBOUNCE (para busca)
// ========================================
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ========================================
// SMOOTH SCROLL
// ========================================
function smoothScrollTo(element, offset = 0) {
  const targetPosition = element.offsetTop - offset;
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
}

// ========================================
// FORMAT DATE/TIME
// ========================================
function formatTime(time) {
  // Recebe "14:00:00" ou "14:00" e retorna "14h00"
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
}

function formatDateBR(dateStr) {
  // Recebe "01/10/2025" e retorna "01 de Outubro"
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const [day, month] = dateStr.split('/');
  const monthIndex = parseInt(month) - 1;
  
  return `${day} de ${months[monthIndex]}`;
}

function formatTimeRange(start, end) {
  // Recebe "14:00" e "16:00" e retorna "14h00 - 16h00"
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// ========================================
// LOADING STATE
// ========================================
function showLoading(container) {
  container.innerHTML = `
    <div class="loading" style="text-align: center; padding: 60px 20px;">
      <div class="loading-spinner" style="
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top-color: #2c5aa0;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 20px;
      "></div>
      <p style="color: #666; font-size: 1rem;">Carregando...</p>
    </div>
  `;
  
  // Adicionar keyframe se não existir
  if (!document.getElementById('spinAnimation')) {
    const style = document.createElement('style');
    style.id = 'spinAnimation';
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

function showError(container, message = 'Erro ao carregar dados') {
  container.innerHTML = `
    <div class="error-state" style="text-align: center; padding: 60px 20px;">
      <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
      <h3 style="color: #333; margin-bottom: 10px; font-size: 1.5rem;">${message}</h3>
      <p style="color: #666;">Por favor, tente novamente mais tarde.</p>
    </div>
  `;
}

function showEmptyState(container, message = 'Nenhum resultado encontrado') {
  container.innerHTML = `
    <div class="empty-state" style="text-align: center; padding: 60px 20px;">
      <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">🔍</div>
      <h3 style="color: #333; margin-bottom: 10px; font-size: 1.5rem;">${message}</h3>
      <p style="color: #666;">Tente ajustar os filtros ou a busca</p>
    </div>
  `;
}

// ========================================
// TRUNCATE TEXT
// ========================================
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// ========================================
// SLUGIFY (para IDs)
// ========================================
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ========================================
// ESCAPE HTML (segurança)
// ========================================
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// GET URL PARAMS
// ========================================
function getURLParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function setURLParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

// ========================================
// ANIMATE ON SCROLL (Intersection Observer)
// ========================================
function initAnimateOnScroll(selector = '.animate-on-scroll', threshold = 0.1) {
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver não suportado');
    return;
  }
  
  const elements = document.querySelectorAll(selector);
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '0';
        entry.target.style.transform = 'translateY(20px)';
        entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, 100);
        
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: threshold,
    rootMargin: '0px 0px -50px 0px'
  });
  
  elements.forEach(el => observer.observe(el));
}

// ========================================
// SEARCH HIGHLIGHT
// ========================================
function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark style="background: #ffeb3b; padding: 2px 4px; border-radius: 2px;">$1</mark>');
}

// ========================================
// COPY TO CLIPBOARD
// ========================================
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('✅ Copiado para clipboard');
    return true;
  } catch (err) {
    console.error('❌ Erro ao copiar:', err);
    return false;
  }
}

// ========================================
// TOAST NOTIFICATION (simples)
// ========================================
function showToast(message, type = 'info', duration = 3000) {
  const colors = {
    info: '#2c5aa0',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 99999;
    animation: slideInRight 0.3s ease;
    max-width: 400px;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
  
  // Adicionar animações se não existirem
  if (!document.getElementById('toastAnimations')) {
    const style = document.createElement('style');
    style.id = 'toastAnimations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// ========================================
// EXPORT PARA USO GLOBAL
// ========================================
window.Utils = {
  Modal: universalModal,
  JSONLoader: jsonLoader,
  debounce,
  smoothScrollTo,
  formatTime,
  formatDateBR,
  formatTimeRange,
  showLoading,
  showError,
  showEmptyState,
  truncateText,
  slugify,
  escapeHTML,
  getURLParam,
  setURLParam,
  initAnimateOnScroll,
  highlightSearchTerm,
  copyToClipboard,
  showToast
};

console.log('✅ Utils.js carregado');
