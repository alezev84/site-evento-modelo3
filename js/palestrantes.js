    // ========================================
    // PALESTRANTES.JS - STANDALONE
    // ========================================

    class PalestrantesManager {
      constructor() {
        this.palestrantesGrid = document.getElementById('palestrantesGrid');
        this.searchInput = document.getElementById('searchPalestrantes');
        this.statsDiv = document.getElementById('palestrantesStats');
        
        this.allPalestrantes = [];
        this.filteredPalestrantes = [];
        this.currentSearch = '';
        
        this.init();
      }
      
      async init() {
        try {
          this.showLoading();
          await this.loadPalestrantes();
          this.setupEventListeners();
          this.filterAndRender();
          console.log('✅ Palestrantes inicializados');
        } catch (error) {
          console.error('❌ Erro ao inicializar:', error);
          this.showError('Erro ao carregar palestrantes');
        }
      }
      
      async loadPalestrantes() {
        try {
          // Fetch do JSON
          const response = await fetch('./data/programacao.json');
          if (!response.ok) throw new Error('Erro ao carregar JSON');
          
          const programacaoData = await response.json();
          
          // Extrair TODOS os palestrantes únicos
          const palestrantesMap = new Map();
          
          programacaoData.forEach(dia => {
            dia.sessoes.forEach(sessao => {
              // Moderadores
              (sessao.moderadores || []).forEach(p => {
                if (p.id && p.nome) {
                  palestrantesMap.set(p.id, p);
                }
              });
              
              // Debatedores
              (sessao.debatedores || []).forEach(p => {
                if (p.id && p.nome) {
                  palestrantesMap.set(p.id, p);
                }
              });
              
              // Núcleo Jovem
              (sessao.nucleo_jovem || []).forEach(p => {
                if (p.id && p.nome) {
                  palestrantesMap.set(p.id, p);
                }
              });
              
              // Palestrantes das aulas
              (sessao.aulas || []).forEach(aula => {
                (aula.palestrantes || []).forEach(p => {
                  if (p.id && p.nome) {
                    palestrantesMap.set(p.id, p);
                  }
                });
              });
            });
          });
          
          // Converter para array e ordenar
          this.allPalestrantes = Array.from(palestrantesMap.values())
            .sort((a, b) => a.nome.localeCompare(b.nome));
          
          console.log(`✅ ${this.allPalestrantes.length} palestrantes únicos extraídos`);
          
        } catch (error) {
          console.error('❌ Erro ao carregar dados:', error);
          throw error;
        }
      }
      
      setupEventListeners() {
        if (this.searchInput) {
          this.searchInput.addEventListener('input', this.debounce((e) => {
            this.currentSearch = e.target.value.toLowerCase().trim();
            this.filterAndRender();
          }, 300));
        }
      }
      
      filterAndRender() {
        // Filtrar
        this.filteredPalestrantes = this.allPalestrantes.filter(p => {
          if (!this.currentSearch) return true;
          
          const searchableText = [
            p.nome,
            p.instituicao,
            p.cidade,
            p.estado,
            p.curriculo
          ].join(' ').toLowerCase();
          
          return searchableText.includes(this.currentSearch);
        });
        
        // Atualizar stats
        this.updateStats();
        
        // Renderizar
        this.render();
      }
      
      updateStats() {
        const total = this.allPalestrantes.length;
        const filtered = this.filteredPalestrantes.length;
        
        if (this.currentSearch) {
          this.statsDiv.textContent = `Mostrando ${filtered} de ${total} palestrantes`;
        } else {
          this.statsDiv.textContent = `${total} palestrantes confirmados`;
        }
      }
      
      render() {
        if (this.filteredPalestrantes.length === 0) {
          this.showEmpty();
          return;
        }
        
        const html = this.filteredPalestrantes.map(p => this.createCard(p)).join('');
        this.palestrantesGrid.innerHTML = html;
        
        // Add event listeners
        this.addCardListeners();
      }
      
      createCard(palestrante) {
        const foto = palestrante.foto || 'https://via.placeholder.com/300x300/667eea/ffffff?text=Sem+Foto';
        const instituicao = palestrante.instituicao || palestrante.cidade || 'Instituição não informada';
        const bio = palestrante.curriculo || 'Informações em breve...';
        
        return `
          <article class="palestrante-card" data-palestrante='${this.encodeJSON(palestrante)}'>
            <div class="palestrante-foto-wrapper">
              <img src="${foto}" alt="${palestrante.nome}" class="palestrante-foto">
            </div>
            <div class="palestrante-content">
              <h3 class="palestrante-nome">${palestrante.nome}</h3>
              <p class="palestrante-instituicao">${instituicao}</p>
              <button class="palestrante-btn">Ver Currículo...</button>
            </div>
          </article>
        `;
      }
      
      addCardListeners() {
        const cards = this.palestrantesGrid.querySelectorAll('.palestrante-card');
        
        cards.forEach(card => {
          card.addEventListener('click', () => {
            const data = card.dataset.palestrante;
            const palestrante = JSON.parse(decodeURIComponent(data));
            this.openModal(palestrante);
          });
        });
      }
      
      openModal(palestrante) {
        const foto = palestrante.foto || 'https://via.placeholder.com/200x250/667eea/ffffff?text=Sem+Foto';
        const curriculo = palestrante.curriculo || 'Informações em breve...';
        const local = [palestrante.cidade, palestrante.estado, palestrante.pais].filter(Boolean).join(', ') || 'Localidade não informada';
        
        const modalContent = `
          <div class="modal-palestrante-detailed">
            <div class="modal-palestrante-header">
              <img src="${foto}" alt="${palestrante.nome}" class="modal-palestrante-foto">
              <div class="modal-palestrante-info">
                <h2 class="modal-palestrante-nome">${palestrante.nome}</h2>
                ${palestrante.instituicao ? `<p class="modal-palestrante-instituicao">${palestrante.instituicao}</p>` : ''}
                <p class="modal-palestrante-local">📍 ${local}</p>
              </div>
            </div>
            <div class="modal-palestrante-body">
              <h3>Currículo</h3>
              <p class="modal-palestrante-cv">${curriculo}</p>
            </div>
          </div>
        `;
        
        // Verificar se Utils.Modal existe, senão usar alternativa
        if (window.Utils && window.Utils.Modal) {
          Utils.Modal.open(modalContent);
        } else {
          this.simpleModal(modalContent);
        }
      }
      
      // Modal simples caso Utils não exista
      simpleModal(content) {
        const modal = document.createElement('div');
        modal.className = 'simple-modal-overlay';
        modal.innerHTML = `
          <div class="simple-modal-content">
            <button class="simple-modal-close">×</button>
            ${content}
          </div>
        `;
        
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7); z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        `;
        
        const modalContent = modal.querySelector('.simple-modal-content');
        modalContent.style.cssText = `
          background: white; border-radius: 16px; padding: 32px;
          max-width: 700px; width: 100%; max-height: 90vh;
          overflow-y: auto; position: relative;
        `;
        
        const closeBtn = modal.querySelector('.simple-modal-close');
        closeBtn.style.cssText = `
          position: absolute; top: 16px; right: 16px;
          background: #e2e8f0; border: none; width: 36px; height: 36px;
          border-radius: 50%; font-size: 24px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        `;
        
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.remove();
        });
        
        document.body.appendChild(modal);
      }
      
      // Utility functions
      encodeJSON(obj) {
        return encodeURIComponent(JSON.stringify(obj));
      }
      
      truncate(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
      }
      
      debounce(func, wait) {
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
      
      showLoading() {
        this.palestrantesGrid.innerHTML = `
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando palestrantes...</p>
          </div>
        `;
      }
      
      showError(message) {
        this.palestrantesGrid.innerHTML = `
          <div class="empty-state" style="color: #e53e3e;">
            <p><strong>⚠️ ERRO:</strong> ${message}</p>
          </div>
        `;
      }
      
      showEmpty() {
        this.palestrantesGrid.innerHTML = `
          <div class="empty-state">
            <p>Nenhum palestrante encontrado para "${this.currentSearch}"</p>
          </div>
        `;
      }
    }

    // Inicialização
    document.addEventListener('DOMContentLoaded', () => {
      window.palestrantesManager = new PalestrantesManager();
      console.log('✅ Página de Palestrantes carregada');
    });
