// ========================================
// UTILS.JS - Funções Compartilhadas
// ========================================

// ========================================
// MODAL SYSTEM (Stackable / Aninhado)
// ========================================
class ModalManager {
  constructor() {
    this.activeModals = []; // Pilha de modais abertos
    this.baseZIndex = 10000; // Z-Index inicial
    this.initStyles();
  }

  initStyles() {
    if (document.getElementById('modalStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'modalStyles';
    styles.textContent = `
      .modal-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .modal-wrapper.active {
        opacity: 1;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(2px);
      }

      /* Container do Modal */
      .modal-container {
        position: relative;
        background: white;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        border-radius: 12px;
        box-shadow: 0 15px 50px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        transform: translateY(20px);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: 2; /* Fica acima do overlay local */
        overflow: hidden; /* Para o header fixo funcionar visualmente */
      }

      .modal-wrapper.active .modal-container {
        transform: translateY(0);
      }

      /* Header Fixo do Modal */
      .modal-header-actions {
        position: absolute;
        top: 15px;
        right: 15px;
        z-index: 10;
      }

      .modal-close {
        background: rgba(0,0,0,0.1);
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 24px;
        line-height: 1;
        color: #333;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-close:hover {
        background: #f44336;
        color: white;
        transform: rotate(90deg);
      }

      /* Conteúdo com Scroll */
      .modal-content-scroll {
        overflow-y: auto;
        padding: 0;
        max-height: 90vh;
        width: 100%;
      }

      /* Estilização interna comum */
      .modal-hero {
        position: relative;
        height: 120px;
        background: linear-gradient(135deg, #1a4d7c, #0f3558);
        padding: 20px;
        color: white;
        display: flex;
        align-items: flex-end;
      }

      .modal-body {
        padding: 30px;
      }

      @media (max-width: 768px) {
        .modal-container {
          width: 95%;
          height: 95vh; /* Quase tela cheia no mobile */
          max-height: 95vh;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  open(contentHTML, customClass = '') {
    // 1. Cria o Wrapper do novo modal
    const modalWrapper = document.createElement('div');
    modalWrapper.className = `modal-wrapper ${customClass}`;
    
    // 2. Calcula Z-Index (Empilhamento)
    // Cada novo modal sobe 10 níveis acima do anterior
    const currentZIndex = this.baseZIndex + (this.activeModals.length * 10);
    modalWrapper.style.zIndex = currentZIndex;

    // 3. Estrutura HTML
    modalWrapper.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-container">
        <div class="modal-header-actions">
          <button class="modal-close" aria-label="Fechar">×</button>
        </div>
        <div class="modal-content-scroll">
          ${contentHTML}
        </div>
      </div>
    `;

    // 4. Adiciona ao DOM
    document.body.appendChild(modalWrapper);
    
    // 5. Salva referência na pilha
    this.activeModals.push(modalWrapper);
    document.body.style.overflow = 'hidden'; // Trava scroll do body

    // 6. Event Listeners (Fechar)
    const closeBtn = modalWrapper.querySelector('.modal-close');
    const overlay = modalWrapper.querySelector('.modal-overlay');

    const closeHandler = () => this.close(modalWrapper);

    closeBtn.addEventListener('click', closeHandler);
    overlay.addEventListener('click', closeHandler);

    // 7. Animação de entrada (pequeno delay para o CSS transition pegar)
    requestAnimationFrame(() => {
      modalWrapper.classList.add('active');
    });

    // 8. Listener de ESC (apenas para o último modal)
    // Removemos listener antigo para evitar duplicação e adicionamos um global
    if (this.activeModals.length === 1) {
        document.addEventListener('keydown', this.handleEsc);
    }
  }

  close(specificModal = null) {
    // Se não passar modal específico, fecha o último (topo da pilha)
    const modalToRemove = specificModal || this.activeModals[this.activeModals.length - 1];

    if (!modalToRemove) return;

    // Remove classe ativa para animação de saída
    modalToRemove.classList.remove('active');

    // Aguarda transição CSS antes de remover do DOM
    setTimeout(() => {
      if (modalToRemove.parentNode) {
        modalToRemove.parentNode.removeChild(modalToRemove);
      }
      
      // Remove do array
      this.activeModals = this.activeModals.filter(m => m !== modalToRemove);

      // Se não houver mais modais, libera scroll do body
      if (this.activeModals.length === 0) {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this.handleEsc);
      }
    }, 300); // Tempo deve bater com transition do CSS
  }

  handleEsc = (e) => {
    if (e.key === 'Escape') {
      this.close(); // Fecha o do topo
    }
  }
}

// Instância Global
const universalModal = new ModalManager();

// ========================================
// FETCH JSON com Cache (MANTIDO)
// ========================================
class JSONLoader {
  constructor() { this.cache = {}; }
  
  async load(url, useCache = true) {
    if (useCache && this.cache[url]) return this.cache[url];
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      this.cache[url] = data;
      return data;
    } catch (error) {
      console.error(`❌ Erro ao carregar ${url}:`, error);
      throw error;
    }
  }
}
const jsonLoader = new JSONLoader();

// ========================================
// HELPERS (MANTIDOS E COMPLETOS)
// ========================================
const Utils = {
  Modal: universalModal,
  JSONLoader: jsonLoader,
  
  slugify: (text) => text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
  
  showLoading: (container) => {
    container.innerHTML = `<div style="padding:40px;text-align:center"><div style="display:inline-block;width:40px;height:40px;border:4px solid #f3f3f3;border-top-color:#2c5aa0;border-radius:50%;animation:spin 1s linear infinite"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style></div>`;
  },

  showError: (container, msg) => {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:#666"><h3>⚠️ Ops!</h3><p>${msg}</p></div>`;
  }
};
