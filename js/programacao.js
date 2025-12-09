/**
 * SCRIPT FINAL DE PROGRAMAÇÃO - VERSÃO FULL STACK
 * Funcionalidades: Leitura de JSON local, Renderização Visual Claude, Modal Stacking
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando sistema de programação...');
    carregarProgramacao();
    setupGlobalListeners();
});

// --- CARREGAMENTO DE DADOS ---
async function carregarProgramacao() {
    // Tenta localizar o container correto no HTML do Claude
    const container = document.getElementById('schedule-container') || 
                      document.getElementById('programacao-container');
    
    if (!container) {
        console.error('❌ ERRO: Container da programação não encontrado no HTML.');
        return;
    }

    try {
        // Tenta ler o arquivo JSON local
        const response = await fetch('data/programacao.json');
        
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const dados = await response.json();
        
        // Armazena dados globalmente para acesso pelos modais
        window.dadosProgramacao = dados;

        // Limpa e Renderiza
        container.innerHTML = '';
        
        if (dados.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma programação encontrada.</div>';
            return;
        }

        dados.forEach((sessao, index) => {
            const card = criarCardHTML(sessao, index);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('❌ Erro fatal:', error);
        container.innerHTML = `
            <div style="padding: 20px; background: #fff0f0; color: #d32f2f; border-radius: 8px; border: 1px solid #ffcdd2;">
                <strong>Erro ao carregar a programação:</strong><br>
                Certifique-se que o arquivo <code>programacao.json</code> está na pasta <code>data</code>.
            </div>
        `;
    }
}

// --- RENDERIZAÇÃO (VISUAL CLAUDE) ---
function criarCardHTML(item, index) {
    const div = document.createElement('div');
    div.className = 'schedule-item'; // Classe original do Claude

    // Gera as bolinhas dos palestrantes (se houver)
    let speakersPreview = '';
    if (item.palestrantes && item.palestrantes.length > 0) {
        speakersPreview = `
            <div class="speakers-preview" style="display: flex; gap: -8px; margin-top: 12px;">
                ${item.palestrantes.map(p => `
                    <div class="speaker-avatar-xs" title="${p.nome}" 
                         style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; overflow: hidden; margin-right: -8px; background: #eee;">
                        <img src="${p.foto || 'assets/default-user.png'}" 
                             style="width: 100%; height: 100%; object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/32'">
                    </div>
                `).join('')}
            </div>
        `;
    }

    div.innerHTML = `
        <div class="schedule-time">
            <span class="time-start">${item.horario_inicio}</span>
            <span class="time-end">${item.horario_fim}</span>
        </div>
        <div class="schedule-content">
            <span class="schedule-location">${item.local || 'Auditório Principal'}</span>
            <h3 class="schedule-title">${item.atividade}</h3>
            ${speakersPreview}
            <button class="btn-details" onclick="abrirModalSessao(${index})" style="margin-top: 15px;">
                Ver detalhes
            </button>
        </div>
    `;

    return div;
}

// --- SISTEMA DE MODAIS (A MÁGICA ACONTECE AQUI) ---

function abrirModalSessao(index) {
    const item = window.dadosProgramacao[index];
    
    // Tenta usar o modal existente no HTML ou busca genericamente
    let modal = document.getElementById('modal-schedule') || document.querySelector('.modal-overlay');
    
    if (!modal) {
        alert('Erro: Estrutura do modal não encontrada no HTML.');
        return;
    }

    // Preenche os textos (com verificação de segurança)
    const setSafeText = (id, text) => {
        const el = modal.querySelector('#' + id) || document.getElementById(id);
        if (el) el.textContent = text;
    };

    setSafeText('modal-title', item.atividade);
    setSafeText('modal-time', `${item.horario_inicio} - ${item.horario_fim}`);
    setSafeText('modal-description', item.descricao || 'Sem descrição detalhada.');

    // Renderiza a lista de palestrantes dentro do modal da sessão
    const speakersList = modal.querySelector('#modal-speakers-list') || document.getElementById('modal-speakers-list');
    
    if (speakersList) {
        if (item.palestrantes && item.palestrantes.length > 0) {
            speakersList.innerHTML = item.palestrantes.map(p => `
                <div class="modal-speaker-item" onclick="abrirModalPalestrantePorCima('${escaparString(p.nome)}')" style="cursor: pointer;">
                    <img src="${p.foto || 'assets/default-user.png'}" onerror="this.src='https://via.placeholder.com/50'">
                    <div class="speaker-info">
                        <h4>${p.nome}</h4>
                        <p>${p.cargo}</p>
                    </div>
                </div>
            `).join('');
            // Mostra a seção de palestrantes
            if(speakersList.parentElement) speakersList.parentElement.style.display = 'block';
        } else {
            // Esconde se não tiver ninguém
            if(speakersList.parentElement) speakersList.parentElement.style.display = 'none';
        }
    }

    // Abre o modal
    modal.classList.add('active');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Trava rolagem do fundo
}

// Função que cria e abre o SEGUNDO modal (sobreposto)
function abrirModalPalestrantePorCima(nome) {
    // 1. Encontra os dados do palestrante
    let palestrante = null;
    window.dadosProgramacao.some(sessao => {
        if (!sessao.palestrantes) return false;
        const found = sessao.palestrantes.find(p => p.nome === nome);
        if (found) {
            palestrante = found;
            return true;
        }
        return false;
    });

    if (!palestrante) return;

    // 2. Cria o HTML do modal dinamicamente (para não depender do seu HTML estático)
    // Verifica se já existe para não duplicar
    let modalSpeaker = document.getElementById('modal-speaker-detail');
    
    if (!modalSpeaker) {
        modalSpeaker = document.createElement('div');
        modalSpeaker.id = 'modal-speaker-detail';
        modalSpeaker.className = 'modal-overlay'; // Reusa estilo base
        // O estilo inline garante que o CSS novo funcione
        modalSpeaker.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="fecharModalSpeaker()">&times;</button>
                <div class="speaker-detail-body" style="text-align: center;">
                    <img id="spk-dyn-img" src="" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem;">
                    <h2 id="spk-dyn-name" style="margin-bottom: 0.5rem;"></h2>
                    <p id="spk-dyn-role" style="color: #666; font-style: italic; margin-bottom: 1rem;"></p>
                    <div id="spk-dyn-bio" style="text-align: left; line-height: 1.6; color: #444;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modalSpeaker);
    }

    // 3. Preenche os dados
    document.getElementById('spk-dyn-img').src = palestrante.foto || 'assets/default-user.png';
    document.getElementById('spk-dyn-name').textContent = palestrante.nome;
    document.getElementById('spk-dyn-role').textContent = palestrante.cargo;
    document.getElementById('spk-dyn-bio').textContent = palestrante.bio || 'Biografia não disponível.';

    // 4. Mostra o modal (Z-Index alto definido no CSS)
    modalSpeaker.classList.add('active');
}

// --- FUNÇÕES DE FECHAMENTO ---

function fecharModalSessao() {
    const modal = document.getElementById('modal-schedule') || document.querySelector('.modal-overlay');
    if (modal) modal.classList.remove('active');
    
    // Só destrava o scroll se o modal de cima também estiver fechado
    if (!document.getElementById('modal-speaker-detail')?.classList.contains('active')) {
        document.body.style.overflow = '';
    }
}

// Esta função precisa ser global para o onclick do HTML dinâmico funcionar
window.fecharModalSpeaker = function() {
    const modal = document.getElementById('modal-speaker-detail');
    if (modal) modal.classList.remove('active');
    // Não mexemos no overflow porque o modal de baixo (sessão) continua aberto
}

// --- HELPERS E LISTENERS ---

function setupGlobalListeners() {
    // Fecha ao clicar fora (Overlay)
    window.addEventListener('click', (e) => {
        const mSpeaker = document.getElementById('modal-speaker-detail');
        const mSession = document.getElementById('modal-schedule') || document.querySelector('.modal-overlay');

        // Se clicou no overlay do modal de cima, fecha ele
        if (e.target === mSpeaker) {
            fecharModalSpeaker();
            return; // Para não propagar pro de baixo
        }
        
        // Se clicou no overlay do modal de baixo (e o de cima não está aberto), fecha o de baixo
        if (e.target === mSession && (!mSpeaker || !mSpeaker.classList.contains('active'))) {
            fecharModalSessao();
        }
    });

    // Escuta tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const mSpeaker = document.getElementById('modal-speaker-detail');
            if (mSpeaker && mSpeaker.classList.contains('active')) {
                fecharModalSpeaker();
            } else {
                fecharModalSessao();
            }
        }
    });
}

function escaparString(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
  
