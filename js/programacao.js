// ========================================
// PROGRAMACAO.JS
// ========================================

class ProgramacaoManager {
  constructor() {
    // Elementos DOM
    this.programacaoGrid = document.getElementById('programacaoGrid');
    this.searchInput = document.getElementById('searchInput');
    this.dayFilters = document.querySelectorAll('.day-filter');
    this.typeFilters = document.querySelectorAll('.type-filter');
    
    // Dados
    this.programacaoData = null;
    this.palestrantesData = null;
    this.filteredSessoes = [];
    
    // Filtros ativos
    this.currentDay = 'todos';
    this.currentType = 'todos';
    this.currentSearch = '';
    
    this.init();
  }
  
  async init() {
    try {
      // Mostrar loading
      Utils.showLoading(this.programacaoGrid);
      
      // Carregar JSONs
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Renderizar
      this.filterAndRender();
      
      console.log('✅ Programação inicializada');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar:', error);
      Utils.showError(this.programacaoGrid, 'Erro ao carregar programação');
    }
  }
  
  async loadData() {
    try {
      // Carregar programação
      this.programacaoData = await Utils.JSONLoader.load('data/programacao.json');
      
      // Carregar palestrantes
      this.palestrantesData = await Utils.JSONLoader.load('data/palestrantes.json');
      
      console.log(`✅ ${this.programacaoData.dias.length} dias carregados`);
      console.log(`✅ ${this.palestrantesData.palestrantes.length} palestrantes carregados`);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      throw error;
    }
  }
  
  setupEventListeners() {
    // Busca com debounce
    if (this.searchInput) {
      const debouncedSearch = Utils.debounce((value) => {
        this.currentSearch = value.toLowerCase().trim();
        this.filterAndRender();
      }, 300);
      
      this.searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });
    }
    
    // Filtros de dia
    this.dayFilters.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dayFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentDay = btn.dataset.day;
        this.filterAndRender();
      });
    });
    
    // Filtros de tipo
    this.typeFilters.forEach(btn => {
      btn.addEventListener('click', () => {
        this.typeFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentType = btn.dataset.type;
        this.filterAndRender();
      });
    });
  }
  
  filterAndRender() {
    // Coletar todas as sessões de todos os dias
    let allSessoes = [];
    
    this.programacaoData.dias.forEach(dia => {
      dia.sessoes.forEach(sessao => {
        allSessoes.push({
          ...sessao,
          dia: dia.numero,
          data: dia.data,
          data_completa: dia.data_completa
        });
      });
    });
    
    // Aplicar filtros
    this.filteredSessoes = allSessoes.filter(sessao => {
      // Filtro de dia
      const matchesDay = this.currentDay === 'todos' || 
                        sessao.dia === parseInt(this.currentDay);
      
      // Filtro de tipo
      const matchesType = this.currentType === 'todos' || 
                         sessao.tipo === this.currentType;
      
      // Filtro de busca
      const searchLower = this.currentSearch;
      const matchesSearch = !searchLower ||
                           sessao.titulo.toLowerCase().includes(searchLower) ||
                           sessao.sala.toLowerCase().includes(searchLower) ||
                           (sessao.descricao && sessao.descricao.toLowerCase().includes(searchLower)) ||
                           this.searchInAulas(sessao.aulas, searchLower) ||
                           this.searchInPessoas(sessao, searchLower);
      
      return matchesDay && matchesType && matchesSearch;
    });
    
    // Renderizar
    this.render();
  }
  
  searchInAulas(aulas, searchTerm) {
    if (!aulas || aulas.length === 0) return false;
    return aulas.some(aula => 
      aula.titulo.toLowerCase().includes(searchTerm) ||
      aula.palestrante_nome.toLowerCase().includes(searchTerm)
    );
  }
  
  searchInPessoas(sessao, searchTerm) {
    // Buscar em moderadores
    if (sessao.moderadores && sessao.moderadores.some(m => 
      m.nome.toLowerCase().includes(searchTerm)
    )) return true;
    
    // Buscar em debatedores
    if (sessao.debatedores && sessao.debatedores.some(d => 
      d.nome.toLowerCase().includes(searchTerm)
    )) return true;
    
    return false;
  }
  
  render() {
    if (this.filteredSessoes.length === 0) {
      Utils.showEmptyState(this.programacaoGrid, 'Nenhuma sessão encontrada');
      return;
    }
    
    // Agrupar por dia se necessário
    const groupedByDay = this.groupByDay(this.filteredSessoes);
    
    let html = '';
    
    groupedByDay.forEach(group => {
      html += `
        <div class="day-group">
          <h2 class="day-title">${Utils.formatDateBR(group.data_completa)}</h2>
          <div class="sessoes-grid">
            ${group.sessoes.map(sessao => this.createSessaoCard(sessao)).join('')}
          </div>
        </div>
      `;
    });
    
    this.programacaoGrid.innerHTML = html;
    
    // Adicionar event listeners aos cards
    this.addCardListeners();
  }
  
  groupByDay(sessoes) {
    const grouped = {};
    
    sessoes.forEach(sessao => {
      const key = sessao.dia;
      if (!grouped[key]) {
        grouped[key] = {
          dia: sessao.dia,
          data: sessao.data,
          data_completa: sessao.data_completa,
          sessoes: []
        };
      }
      grouped[key].sessoes.push(sessao);
    });
    
    // Converter para array e ordenar por dia
    return Object.values(grouped).sort((a, b) => a.dia - b.dia);
  }
  
  createSessaoCard(sessao) {
    const typeLabels = {
      'keynote': 'Palestra Magna',
      'roundtable': 'Mesa Redonda',
      'symposium': 'Simpósio',
      'workshop': 'Workshop',
      'conference': 'Conferência',
      'break': 'Intervalo',
      'lunch': 'Almoço'
    };
    
    const typeLabel = typeLabels[sessao.tipo] || 'Sessão';
    
    // Coletar nomes (sem função)
    const nomes = [];
    
    // Moderadores
    if (sessao.moderadores && sessao.moderadores.length > 0) {
      sessao.moderadores.forEach(m => nomes.push(m.nome));
    }
    
    // Palestrantes das aulas
    if (sessao.aulas && sessao.aulas.length > 0) {
      sessao.aulas.forEach(aula => {
        if (aula.palestrante_nome && !nomes.includes(aula.palestrante_nome)) {
          nomes.push(aula.palestrante_nome);
        }
      });
    }
    
    // Debatedores
    if (sessao.debatedores && sessao.debatedores.length > 0) {
      sessao.debatedores.forEach(d => {
        if (!nomes.includes(d.nome)) {
          nomes.push(d.nome);
        }
      });
    }
    
    // Núcleo Jovem
    if (sessao.nucleo_jovem && sessao.nucleo_jovem.length > 0) {
      sessao.nucleo_jovem.forEach(nj => {
        if (!nomes.includes(nj.nome)) {
          nomes.push(nj.nome);
        }
      });
    }
    
    const nomesTexto = nomes.length > 0 ? nomes.join(', ') : 'A definir';
    
    return `
      <article class="sessao-card animate-on-scroll" data-sessao-id="${sessao.id}">
        <div class="sessao-header-badge ${sessao.tipo}">
          ${sessao.titulo}
        </div>
        <div class="sessao-content">
          <div class="sessao-meta">
            <span class="sessao-time">⏰ ${Utils.formatTimeRange(sessao.horario_inicio, sessao.horario_fim)}</span>
            <span class="sessao-room">📍 ${sessao.sala}</span>
          </div>
          <div class="sessao-speakers">
            ${Utils.truncateText(nomesTexto, 100)}
          </div>
          <button class="sessao-btn-inline">Ver Detalhes</button>
        </div>
      </article>
    `;
  }
  
  addCardListeners() {
    const cards = this.programacaoGrid.querySelectorAll('.sessao-card');
    
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const sessaoId = card.dataset.sessaoId;
        this.openSessaoModal(sessaoId);
      });
      
      // Keyboard accessibility
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const sessaoId = card.dataset.sessaoId;
          this.openSessaoModal(sessaoId);
        }
      });
    });
    
    // Animar cards
    Utils.initAnimateOnScroll('.animate-on-scroll');
  }
  
  openSessaoModal(sessaoId) {
    // Encontrar sessão
    let sessao = null;
    
    for (const dia of this.programacaoData.dias) {
      const found = dia.sessoes.find(s => s.id === sessaoId);
      if (found) {
        sessao = {
          ...found,
          dia: dia.numero,
          data: dia.data,
          data_completa: dia.data_completa
        };
        break;
      }
    }
    
    if (!sessao) {
      console.error('Sessão não encontrada:', sessaoId);
      return;
    }
    
    // Gerar conteúdo do modal
    const modalContent = this.generateSessaoModalContent(sessao);
    
    // Abrir modal
    Utils.Modal.open(modalContent);
  }
  
  generateSessaoModalContent(sessao) {
    const typeLabels = {
      'keynote': 'Palestra Magna',
      'roundtable': 'Mesa Redonda',
      'symposium': 'Simpósio',
      'workshop': 'Workshop',
      'conference': 'Conferência'
    };
    
    const typeLabel = typeLabels[sessao.tipo] || 'Sessão';
    
    let html = `
      <div class="modal-sessao">
        <div class="modal-header">
          <span class="modal-type-badge ${sessao.tipo}">${typeLabel}</span>
          <h2 class="modal-title">${sessao.titulo}</h2>
          <div class="modal-meta">
            <span class="modal-date">📅 ${Utils.formatDateBR(sessao.data_completa)}</span>
            <span class="modal-time">⏰ ${Utils.formatTimeRange(sessao.horario_inicio, sessao.horario_fim)}</span>
            <span class="modal-room">📍 ${sessao.sala}</span>
          </div>
          ${sessao.descricao ? `<p class="modal-description">${sessao.descricao}</p>` : ''}
        </div>
    `;
    
    // Moderadores
    if (sessao.moderadores && sessao.moderadores.length > 0) {
      html += `
        <div class="modal-section">
          <h3 class="modal-section-title">Moderação</h3>
          <div class="modal-pessoas-grid">
            ${sessao.moderadores.map(mod => this.createPessoaCard(mod, 'moderador')).join('')}
          </div>
        </div>
      `;
    }
    
    // Aulas/Apresentações
    if (sessao.aulas && sessao.aulas.length > 0) {
      html += `
        <div class="modal-section">
          <h3 class="modal-section-title">Programação</h3>
          <div class="modal-aulas">
            ${sessao.aulas.map(aula => this.createAulaItem(aula)).join('')}
          </div>
        </div>
      `;
    }
    
    // Debatedores
    if (sessao.debatedores && sessao.debatedores.length > 0) {
      html += `
        <div class="modal-section">
          <h3 class="modal-section-title">Debatedores</h3>
          <div class="modal-pessoas-grid">
            ${sessao.debatedores.map(deb => this.createPessoaCard(deb, 'debatedor')).join('')}
          </div>
        </div>
      `;
    }
    
    // Núcleo Jovem
    if (sessao.nucleo_jovem && sessao.nucleo_jovem.length > 0) {
      html += `
        <div class="modal-section">
          <h3 class="modal-section-title">Núcleo Jovem</h3>
          <div class="modal-pessoas-grid">
            ${sessao.nucleo_jovem.map(nj => this.createPessoaCard(nj, 'nucleo-jovem')).join('')}
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
    
    return html;
  }
  
  createPessoaCard(pessoa, role) {
    const palestrante = this.getPalestranteById(pessoa.palestrante_id);
    
    return `
      <div class="modal-pessoa-card" data-palestrante-id="${pessoa.palestrante_id}">
        <img src="${pessoa.foto}" alt="${pessoa.nome}" class="modal-pessoa-foto">
        <div class="modal-pessoa-info">
          <h4 class="modal-pessoa-nome">${pessoa.nome}</h4>
          ${pessoa.instituicao ? `<p class="modal-pessoa-instituicao">${pessoa.instituicao}</p>` : ''}
          ${palestrante ? `<button class="modal-pessoa-btn" data-palestrante-id="${pessoa.palestrante_id}">Ver Currículo</button>` : ''}
        </div>
      </div>
    `;
  }
  
  createAulaItem(aula) {
    return `
      <div class="modal-aula-item">
        <div class="modal-aula-time">
          <span>${Utils.formatTimeRange(aula.horario_inicio, aula.horario_fim)}</span>
        </div>
        <div class="modal-aula-content">
          <h4 class="modal-aula-titulo">${aula.titulo}</h4>
          <div class="modal-aula-palestrante" data-palestrante-id="${aula.palestrante_id}">
            <img src="${aula.palestrante_foto}" alt="${aula.palestrante_nome}" class="modal-aula-foto">
            <span class="modal-aula-nome">${aula.palestrante_nome}</span>
            <button class="modal-aula-btn" data-palestrante-id="${aula.palestrante_id}">Ver Currículo</button>
          </div>
        </div>
      </div>
    `;
  }
  
  getPalestranteById(id) {
    if (!this.palestrantesData || !id) return null;
    return this.palestrantesData.palestrantes.find(p => p.id === id);
  }
  
  openPalestranteModal(palestranteId) {
    const palestrante = this.getPalestranteById(palestranteId);
    
    if (!palestrante) {
      console.error('Palestrante não encontrado:', palestranteId);
      return;
    }
    
    const modalContent = `
      <div class="modal-palestrante">
        <div class="modal-palestrante-header">
          <img src="${palestrante.foto}" alt="${palestrante.nome}" class="modal-palestrante-foto">
          <div class="modal-palestrante-info">
            <h2 class="modal-palestrante-nome">${palestrante.nome}</h2>
            <p class="modal-palestrante-local">📍 ${palestrante.cidade}, ${palestrante.estado} - ${palestrante.pais}</p>
          </div>
        </div>
        <div class="modal-palestrante-body">
          <h3>Currículo</h3>
          <p class="modal-palestrante-cv">${palestrante.curriculo_completo}</p>
        </div>
      </div>
    `;
    
    // Abrir modal SOBRE o modal da sessão (stack)
    Utils.Modal.open(modalContent);
  }
}

// ========================================
// Event Delegation para botões de palestrante no modal
// ========================================
document.addEventListener('click', (e) => {
  if (e.target.matches('.modal-pessoa-btn, .modal-aula-btn')) {
    const palestranteId = e.target.dataset.palestranteId;
    if (window.programacaoManager) {
      window.programacaoManager.openPalestranteModal(palestranteId);
    }
  }
});

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  window.programacaoManager = new ProgramacaoManager();
  console.log('✅ Programação carregada');
});
