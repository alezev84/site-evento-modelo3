// ========================================
// PROGRAMACAO.JS - REFATORADO PARA JSON DEFINITIVO
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
      
      // Carregar JSON
      await this.loadData();
      
      // Atualizar filtros de dias dinamicamente
      this.updateDayFilters();
      
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
      // Carregar programação (NOVO FORMATO - Array direto)
      this.programacaoData = await Utils.JSONLoader.load('./data/programacao.json');
      
      console.log(`✅ ${this.programacaoData.length} dias carregados`);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      throw error;
    }
  }
  
  updateDayFilters() {
    // Atualizar botões de filtro de dias dinamicamente
    const filterButtons = document.querySelector('.day-filter').parentElement;
    filterButtons.innerHTML = '<button class="day-filter active" data-day="todos">Todos</button>';
    
    this.programacaoData.forEach(dia => {
      const btn = document.createElement('button');
      btn.className = 'day-filter';
      btn.dataset.day = dia.numero;
      btn.textContent = dia.data;
      filterButtons.appendChild(btn);
    });
    
    // Reatribuir variável
    this.dayFilters = document.querySelectorAll('.day-filter');
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
    
    // Filtros de dia (event delegation)
    document.querySelector('.filter-buttons').addEventListener('click', (e) => {
      if (e.target.classList.contains('day-filter')) {
        this.dayFilters.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentDay = e.target.dataset.day;
        this.filterAndRender();
      }
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
    
    this.programacaoData.forEach(dia => {
      dia.sessoes.forEach(sessao => {
        allSessoes.push({
          ...sessao,
          dia_numero: dia.numero,
          dia_data: dia.data,
          dia_semana: dia.dia_semana
        });
      });
    });
    
    // Aplicar filtros
    this.filteredSessoes = allSessoes.filter(sessao => {
      // Filtro de dia
      const matchesDay = this.currentDay === 'todos' || 
                        sessao.dia_numero === parseInt(this.currentDay);
      
      // Filtro de tipo
      const matchesType = this.currentType === 'todos' || 
                         sessao.tipo === this.currentType;
      
      // Filtro de busca
      const searchLower = this.currentSearch;
      const matchesSearch = !searchLower ||
                           sessao.titulo.toLowerCase().includes(searchLower) ||
                           sessao.sala.toLowerCase().includes(searchLower) ||
                           this.searchInAulas(sessao.aulas, searchLower) ||
                           this.searchInPessoas(sessao, searchLower);
      
      return matchesDay && matchesType && matchesSearch;
    });
    
    // Renderizar
    this.render();
  }
  
  searchInAulas(aulas, searchTerm) {
    if (!aulas || aulas.length === 0) return false;
    return aulas.some(aula => {
      const titulo = aula.titulo_aula || aula.titulo || '';
      const palestrantes = aula.palestrantes || [];
      return titulo.toLowerCase().includes(searchTerm) ||
             palestrantes.some(p => p.nome.toLowerCase().includes(searchTerm));
    });
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
    
    // Buscar em núcleo jovem
    if (sessao.nucleo_jovem && sessao.nucleo_jovem.some(nj => 
      nj.nome.toLowerCase().includes(searchTerm)
    )) return true;
    
    return false;
  }
  
  render() {
    if (this.filteredSessoes.length === 0) {
      Utils.showEmptyState(this.programacaoGrid, 'Nenhuma sessão encontrada');
      return;
    }
    
    // Agrupar por dia
    const groupedByDay = this.groupByDay(this.filteredSessoes);
    
    let html = '';
    
    groupedByDay.forEach(group => {
      html += `
        <div class="day-group">
          <h2 class="day-title">${group.dia_data} - ${group.dia_semana}</h2>
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
      const key = sessao.dia_numero;
      if (!grouped[key]) {
        grouped[key] = {
          dia_numero: sessao.dia_numero,
          dia_data: sessao.dia_data,
          dia_semana: sessao.dia_semana,
          sessoes: []
        };
      }
      grouped[key].sessoes.push(sessao);
    });
    
    // Converter para array e ordenar por dia
    return Object.values(grouped).sort((a, b) => a.dia_numero - b.dia_numero);
  }
  
  createSessaoCard(sessao) {
    const typeLabels = {
      'Mesa': 'Mesa Redonda',
      'Sessão Científica': 'Sessão Científica',
      'keynote': 'Palestra Magna',
      'symposium': 'Simpósio',
      'workshop': 'Workshop'
    };
    
    const typeLabel = typeLabels[sessao.tipo] || sessao.tipo || 'Sessão';
    
    // Coletar TODOS os nomes (sem duplicatas)
    const allNames = new Set();
    
    // Moderadores
    (sessao.moderadores || []).forEach(m => allNames.add(m.nome));
    
    // Debatedores
    (sessao.debatedores || []).forEach(d => allNames.add(d.nome));
    
    // Núcleo Jovem
    (sessao.nucleo_jovem || []).forEach(nj => allNames.add(nj.nome));
    
    // Palestrantes das aulas
    (sessao.aulas || []).forEach(aula => {
      (aula.palestrantes || []).forEach(p => allNames.add(p.nome));
    });
    
    const nomesArray = Array.from(allNames);
    const nomesTexto = nomesArray.length > 0 ? nomesArray.join(', ') : 'A definir';
    
    return `
      <article class="sessao-card" data-sessao-id="${sessao.id}">
        <div class="sessao-header-badge ${sessao.tipo.toLowerCase().replace(/\s+/g, '-')}">
          ${sessao.titulo}
        </div>
        <div class="sessao-content">
          <div class="sessao-meta">
            <span class="sessao-time">⏰ ${this.formatTime(sessao.horario_inicio)} - ${this.formatTime(sessao.horario_fim)}</span>
            <span class="sessao-room">📍 ${sessao.sala}</span>
          </div>
          <div class="sessao-speakers">
            ${Utils.truncateText(nomesTexto, 120)}
          </div>
          <button class="sessao-btn-inline">Ver Detalhes</button>
        </div>
      </article>
    `;
  }
  
  formatTime(timeString) {
    if (!timeString) return 'A definir';
    return timeString.substring(0, 5);
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
    
    for (const dia of this.programacaoData) {
      const found = dia.sessoes.find(s => s.id === sessaoId);
      if (found) {
        sessao = {
          ...found,
          dia_numero: dia.numero,
          dia_data: dia.data,
          dia_semana: dia.dia_semana
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
      'Mesa': 'Mesa Redonda',
      'Sessão Científica': 'Sessão Científica',
      'keynote': 'Palestra Magna',
      'symposium': 'Simpósio',
      'workshop': 'Workshop'
    };
    
    const typeLabel = typeLabels[sessao.tipo] || sessao.tipo || 'Sessão';
    
    let html = `
      <div class="modal-sessao">
        <div class="modal-header">
          <span class="modal-type-badge ${sessao.tipo.toLowerCase().replace(/\s+/g, '-')}">${typeLabel}</span>
          <h2 class="modal-title">${sessao.titulo}</h2>
          <div class="modal-meta">
            <span class="modal-date">📅 ${sessao.dia_data} - ${sessao.dia_semana}</span>
            <span class="modal-time">⏰ ${this.formatTime(sessao.horario_inicio)} - ${this.formatTime(sessao.horario_fim)}</span>
            <span class="modal-room">📍 ${sessao.sala}</span>
          </div>
        </div>
    `;
    
    // ===================================
    // NOVO: INTEGRANTES DA MESA (AGRUPADOS)
    // ===================================
    const temModerador = sessao.moderadores && sessao.moderadores.length > 0;
    const temDebatedor = sessao.debatedores && sessao.debatedores.length > 0;
    const temNucleoJovem = sessao.nucleo_jovem && sessao.nucleo_jovem.length > 0;
    
    if (temModerador || temDebatedor || temNucleoJovem) {
      html += `
        <div class="modal-section">
          <h3 class="modal-section-title">Integrantes da Mesa</h3>
          <div class="modal-pessoas-grid">
      `;
      
      // Moderadores
      if (temModerador) {
        sessao.moderadores.forEach(mod => {
          html += this.createPessoaCard(mod, 'Moderador(a)');
        });
      }
      
      // Debatedores
      if (temDebatedor) {
        sessao.debatedores.forEach(deb => {
          html += this.createPessoaCard(deb, 'Debatedor(a)');
        });
      }
      
      // Núcleo Jovem
      if (temNucleoJovem) {
        sessao.nucleo_jovem.forEach(nj => {
          html += this.createPessoaCard(nj, 'Núcleo Jovem');
        });
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    // ===================================
    // AULAS/APRESENTAÇÕES (CRONOGRAMA)
    // ===================================
    if (sessao.aulas && sessao.aulas.length > 0) {
      html += `
        <div class="modal-section">
          <h3 class="modal-section-title">Programação / Cronograma</h3>
          <div class="modal-aulas">
            ${sessao.aulas.map(aula => this.createAulaItem(aula)).join('')}
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
    
    return html;
  }
  
  createPessoaCard(pessoa, role) {
    const foto = pessoa.foto || 'https://via.placeholder.com/100x100/cccccc/666666?text=Sem+Foto';
    const curriculo = pessoa.curriculo || '';
    
    return `
      <div class="modal-pessoa-card" ${curriculo ? `data-pessoa='${this.encodeJSON(pessoa)}'` : ''}>
        <img src="${foto}" alt="${pessoa.nome}" class="modal-pessoa-foto">
        <div class="modal-pessoa-info">
          <p style="font-size: 0.75rem; color: var(--accent-color); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">${role}</p>
          <h4 class="modal-pessoa-nome">${pessoa.nome}</h4>
          ${pessoa.instituicao ? `<p class="modal-pessoa-instituicao">${pessoa.instituicao}</p>` : ''}
          ${curriculo ? `<button class="modal-pessoa-btn">Ver Currículo</button>` : ''}
        </div>
      </div>
    `;
  }
  
  createAulaItem(aula) {
    const titulo = aula.titulo_aula || aula.titulo || 'Atividade A Definir';
    const palestrantes = aula.palestrantes || [];
    
    let palestrantesHTML = '';
    
    if (palestrantes.length > 0) {
      palestrantesHTML = palestrantes.map(p => {
        const foto = p.foto || 'https://via.placeholder.com/70x70/cccccc/666666?text=Sem+Foto';
        const curriculo = p.curriculo || '';
        
        return `
          <div class="modal-aula-palestrante" ${curriculo ? `data-pessoa='${this.encodeJSON(p)}'` : ''}>
            <img src="${foto}" alt="${p.nome}" class="modal-aula-foto">
            <span class="modal-aula-nome">${p.nome}</span>
            ${curriculo ? `<button class="modal-aula-btn">Ver Currículo</button>` : ''}
          </div>
        `;
      }).join('');
    }
    
    return `
      <div class="modal-aula-item">
        <div class="modal-aula-time">
          <span>${this.formatTime(aula.horario_inicio)} - ${this.formatTime(aula.horario_fim)}</span>
        </div>
        <div class="modal-aula-content">
          <h4 class="modal-aula-titulo">${titulo}</h4>
          ${palestrantesHTML}
        </div>
      </div>
    `;
  }
  
  encodeJSON(obj) {
    return encodeURIComponent(JSON.stringify(obj));
  }
  
  openPalestranteModal(pessoa) {
    const foto = pessoa.foto || 'https://via.placeholder.com/200x250/cccccc/666666?text=Sem+Foto';
    const curriculo = pessoa.curriculo || 'Informações em breve...';
    const local = [pessoa.cidade, pessoa.estado, pessoa.pais].filter(Boolean).join(', ') || 'Localidade não informada';
    
    const modalContent = `
      <div class="modal-palestrante">
        <div class="modal-palestrante-header">
          <img src="${foto}" alt="${pessoa.nome}" class="modal-palestrante-foto">
          <div class="modal-palestrante-info">
            <h2 class="modal-palestrante-nome">${pessoa.nome}</h2>
            ${pessoa.instituicao ? `<p class="modal-palestrante-instituicao">${pessoa.instituicao}</p>` : ''}
            <p class="modal-palestrante-local">📍 ${local}</p>
          </div>
        </div>
        <div class="modal-palestrante-body">
          <h3>Currículo</h3>
          <p class="modal-palestrante-cv">${curriculo}</p>
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
    const card = e.target.closest('[data-pessoa]');
    if (card && window.programacaoManager) {
      const pessoaJSON = decodeURIComponent(card.dataset.pessoa);
      const pessoa = JSON.parse(pessoaJSON);
      window.programacaoManager.openPalestranteModal(pessoa);
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
