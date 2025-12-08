// ========================================
// PALESTRANTES.JS (ATUALIZADO)
// ========================================

class SpeakersManager {
  constructor() {
    // Elementos do DOM
    this.speakersGrid = document.getElementById('speakersGrid');
    this.searchInput = document.getElementById('searchInput');
    this.resultsCount = document.getElementById('resultsCount');
    this.pagination = document.getElementById('pagination');
    this.paginationInfo = document.getElementById('paginationInfo');
    this.pageNumbers = document.getElementById('pageNumbers');
    
    // Dados
    this.allSpeakers = [];
    this.filteredSpeakers = [];
    this.currentFilter = 'todos';
    this.currentSearch = '';
    
    // Paginação
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.totalPages = 1;
    
    this.init();
  }
  
  async init() {
    try {
      // Mostrar loading
      Utils.showLoading(this.speakersGrid);
      
      // Carregar dados
      await this.loadSpeakers();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Renderizar
      this.filterAndRender();
      
      console.log('✅ Palestrantes inicializados');
      
    } catch (error) {
      console.error('❌ Erro ao carregar palestrantes:', error);
      Utils.showError(this.speakersGrid, 'Erro ao carregar palestrantes');
    }
  }
  
  async loadSpeakers() {
    try {
      const data = await Utils.JSONLoader.load('data/palestrantes.json');
      this.allSpeakers = data.palestrantes;
      
      console.log(`✅ ${this.allSpeakers.length} palestrantes carregados`);
    } catch (error) {
      console.error('❌ Erro ao carregar palestrantes:', error);
      throw error;
    }
  }
  
  setupEventListeners() {
    // Busca com debounce
    if (this.searchInput) {
      const debouncedSearch = Utils.debounce((value) => {
        this.currentSearch = value.toLowerCase().trim();
        this.currentPage = 1;
        this.filterAndRender();
      }, 300);
      
      this.searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });
    }
    
    // Filtros por especialidade
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remover active de todos
        filterButtons.forEach(b => b.classList.remove('active'));
        // Adicionar active no clicado
        btn.classList.add('active');
        
        this.currentFilter = btn.dataset.filter;
        this.currentPage = 1;
        this.filterAndRender();
      });
    });
    
    // Paginação
    document.getElementById('firstPageBtn')?.addEventListener('click', () => this.goToPage(1));
    document.getElementById('prevPageBtn')?.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    document.getElementById('nextPageBtn')?.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    document.getElementById('lastPageBtn')?.addEventListener('click', () => this.goToPage(this.totalPages));
  }
  
  filterAndRender() {
    // Aplicar filtros
    this.filteredSpeakers = this.allSpeakers.filter(speaker => {
      // Filtro de especialidade
      const matchesFilter = this.currentFilter === 'todos' || 
                           speaker.especialidade === this.currentFilter;
      
      // Filtro de busca (nome, especialidade, instituição, cidade)
      const matchesSearch = !this.currentSearch ||
                           speaker.nome.toLowerCase().includes(this.currentSearch) ||
                           speaker.especialidade.toLowerCase().includes(this.currentSearch) ||
                           speaker.instituicao.toLowerCase().includes(this.currentSearch) ||
                           speaker.cidade.toLowerCase().includes(this.currentSearch) ||
                           speaker.estado.toLowerCase().includes(this.currentSearch);
      
      return matchesFilter && matchesSearch;
    });
    
    // Atualizar contagem
    this.updateResultsCount();
    
    // Calcular paginação
    this.totalPages = Math.ceil(this.filteredSpeakers.length / this.itemsPerPage);
    
    // Garantir que currentPage está dentro dos limites
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    // Renderizar página atual
    this.renderCurrentPage();
    
    // Atualizar paginação
    this.updatePagination();
  }
  
  renderCurrentPage() {
    // Verificar se há resultados
    if (this.filteredSpeakers.length === 0) {
      this.speakersGrid.style.display = 'none';
      Utils.showEmptyState(this.speakersGrid.parentElement);
      this.pagination.style.display = 'none';
      return;
    }
    
    // Mostrar grid
    this.speakersGrid.style.display = 'grid';
    
    // Calcular índices
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageItems = this.filteredSpeakers.slice(startIndex, endIndex);
    
    // Renderizar cards
    this.speakersGrid.innerHTML = pageItems.map(speaker => this.createSpeakerCard(speaker)).join('');
    
    // Adicionar event listeners aos cards
    this.addCardListeners();
    
    // Scroll to top suave
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  createSpeakerCard(speaker) {
    return `
      <article class="speaker-card animate-on-scroll" data-speaker-id="${speaker.id}" tabindex="0" role="button" aria-label="Ver detalhes de ${speaker.nome}">
        <div class="speaker-image-wrapper">
          <img src="${speaker.foto}" alt="${speaker.nome}" class="speaker-img" loading="lazy">
          
          <!-- Info padrão (visível sempre) -->
          <div class="speaker-info">
            <h3 class="speaker-name">${speaker.nome}</h3>
            <p class="speaker-specialty">${speaker.especialidade}</p>
            <p class="speaker-institution">${speaker.instituicao}</p>
          </div>
        </div>
      </article>
    `;
  }
  
  addCardListeners() {
    const cards = this.speakersGrid.querySelectorAll('.speaker-card');
    
    cards.forEach(card => {
      // Click para abrir modal
      card.addEventListener('click', () => {
        const speakerId = card.dataset.speakerId;
        this.openSpeakerModal(speakerId);
      });
      
      // Keyboard accessibility
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const speakerId = card.dataset.speakerId;
          this.openSpeakerModal(speakerId);
        }
      });
    });
    
    // Animar cards
    Utils.initAnimateOnScroll('.animate-on-scroll');
  }
  
  openSpeakerModal(speakerId) {
    const speaker = this.allSpeakers.find(s => s.id === speakerId);
    
    if (!speaker) {
      console.error('Palestrante não encontrado:', speakerId);
      return;
    }
    
    // Gerar conteúdo do modal
    const modalContent = `
      <div class="modal-palestrante">
        <div class="modal-palestrante-header">
          <img src="${speaker.foto}" alt="${speaker.nome}" class="modal-palestrante-foto">
          <div class="modal-palestrante-info">
            <h2 class="modal-palestrante-nome">${speaker.nome}</h2>
            <p class="modal-palestrante-instituicao">${speaker.instituicao}</p>
            <span class="modal-palestrante-especialidade">${speaker.especialidade}</span>
            <p class="modal-palestrante-local">📍 ${speaker.cidade}, ${speaker.estado} - ${speaker.pais}</p>
          </div>
        </div>
        <div class="modal-palestrante-body">
          <h3>Currículo</h3>
          <p class="modal-palestrante-cv">${speaker.curriculo_completo || speaker.mini_cv}</p>
        </div>
      </div>
    `;
    
    // Abrir modal usando utils.js
    Utils.Modal.open(modalContent);
  }
  
  updateResultsCount() {
    const total = this.filteredSpeakers.length;
    const label = total === 1 ? 'palestrante' : 'palestrantes';
    this.resultsCount.textContent = `${total} ${label}`;
  }
  
  updatePagination() {
    if (this.totalPages <= 1) {
      this.pagination.style.display = 'none';
      return;
    }
    
    this.pagination.style.display = 'flex';
    
    // Atualizar botões prev/next
    document.getElementById('firstPageBtn').disabled = this.currentPage === 1;
    document.getElementById('prevPageBtn').disabled = this.currentPage === 1;
    document.getElementById('nextPageBtn').disabled = this.currentPage === this.totalPages;
    document.getElementById('lastPageBtn').disabled = this.currentPage === this.totalPages;
    
    // Gerar números de página
    this.pageNumbers.innerHTML = this.generatePageNumbers();
    
    // Info de paginação
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredSpeakers.length);
    this.paginationInfo.textContent = `${start}-${end} de ${this.filteredSpeakers.length}`;
    
    // Event listeners para números
    const pageButtons = this.pageNumbers.querySelectorAll('.pagination-btn');
    pageButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        this.goToPage(page);
      });
    });
  }
  
  generatePageNumbers() {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    
    // Ajustar se estivermos no final
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // Primeira página + ellipsis
    if (startPage > 1) {
      pages.push(`<button class="pagination-btn" data-page="1">1</button>`);
      if (startPage > 2) {
        pages.push(`<span class="pagination-ellipsis">...</span>`);
      }
    }
    
    // Páginas visíveis
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === this.currentPage ? 'active' : '';
      pages.push(`<button class="pagination-btn ${activeClass}" data-page="${i}">${i}</button>`);
    }
    
    // Ellipsis + última página
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        pages.push(`<span class="pagination-ellipsis">...</span>`);
      }
      pages.push(`<button class="pagination-btn" data-page="${this.totalPages}">${this.totalPages}</button>`);
    }
    
    return pages.join('');
  }
  
  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    
    this.currentPage = page;
    this.renderCurrentPage();
    this.updatePagination();
  }
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  window.speakersManager = new SpeakersManager();
  console.log('✅ Página de palestrantes carregada');
});
