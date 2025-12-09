document.addEventListener('DOMContentLoaded', () => {
    carregarProgramacao();
    setupModalListeners();
});

async function carregarProgramacao() {
    const container = document.getElementById('schedule-container'); // ID usado no HTML do Claude
    
    if (!container) {
        console.error('Container da programação não encontrado!');
        return;
    }

    try {
        // Carrega o arquivo gerado pelo seu script
        const response = await fetch('data/programacao.json');
        const dadosOriginais = await response.json();

        // Limpa o container
        container.innerHTML = '';

        // Renderiza cada item traduzindo os campos
        dadosOriginais.forEach((item, index) => {
            const card = criarCardProgramacao(item, index);
            container.appendChild(card);
        });

        // Salva os dados globalmente para usar nos modais
        window.dadosProgramacao = dadosOriginais;

    } catch (error) {
        console.error('Erro ao carregar programação:', error);
        container.innerHTML = '<p class="error-msg">Erro ao carregar a programação. Verifique se o arquivo programacao.json está na pasta.</p>';
    }
}

function criarCardProgramacao(item, index) {
    const div = document.createElement('div');
    div.className = 'schedule-item'; // Classe do Claude

    // TRADUÇÃO DOS CAMPOS AQUI:
    // item.horario_inicio + fim -> time
    // item.atividade -> title
    // item.local -> location
    
    // Verifica se tem palestrantes para mostrar as bolinhas (avatars)
    let speakersHtml = '';
    if (item.palestrantes && item.palestrantes.length > 0) {
        speakersHtml = `
            <div class="schedule-speakers">
                ${item.palestrantes.map(p => `
                    <div class="speaker-avatar-small" title="${p.nome}">
                        <img src="${p.foto || 'assets/default-user.png'}" alt="${p.nome}" onerror="this.src='assets/default-user.png'">
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
            <span class="schedule-tag">${item.local || 'Auditório'}</span>
            <h3 class="schedule-title">${item.atividade}</h3>
            ${speakersHtml}
            <button class="btn-details" onclick="abrirModalSessao(${index})">Ver detalhes</button>
        </div>
    `;

    return div;
}

// --- LÓGICA DE MODAIS (Corrigida para Stack) ---

function abrirModalSessao(index) {
    const item = window.dadosProgramacao[index];
    const modal = document.getElementById('modal-schedule'); // ID do modal no HTML do Claude
    
    if (!modal) return;

    // Preenche os dados do modal
    document.getElementById('modal-title').textContent = item.atividade;
    document.getElementById('modal-time').textContent = `${item.horario_inicio} - ${item.horario_fim}`;
    document.getElementById('modal-description').textContent = item.descricao || 'Sem descrição disponível.';
    
    // Preenche lista de palestrantes dentro do modal
    const speakersContainer = document.getElementById('modal-speakers-list');
    if (speakersContainer) {
        if (item.palestrantes && item.palestrantes.length > 0) {
            speakersContainer.innerHTML = item.palestrantes.map(p => `
                <div class="modal-speaker-item" onclick="abrirModalPalestranteDetalhe('${p.nome}')">
                    <img src="${p.foto || 'assets/default-user.png'}" alt="${p.nome}" onerror="this.src='assets/default-user.png'">
                    <div class="speaker-info">
                        <h4>${p.nome}</h4>
                        <p>${p.cargo}</p>
                        <span class="view-profile-link">Ver perfil completo</span>
                    </div>
                </div>
            `).join('');
            speakersContainer.parentElement.style.display = 'block';
        } else {
            speakersContainer.parentElement.style.display = 'none';
        }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Trava o scroll do fundo
}

// Função simulada para encontrar palestrante pelo nome (já que não temos ID)
function abrirModalPalestranteDetalhe(nomePalestrante) {
    // Procura em todas as sessões para achar os dados completos do palestrante
    let palestranteEncontrado = null;
    
    // Varre os dados para achar a bio e foto
    for (const sessao of window.dadosProgramacao) {
        const p = sessao.palestrantes.find(sp => sp.nome === nomePalestrante);
        if (p) {
            palestranteEncontrado = p;
            break;
        }
    }

    if (palestranteEncontrado) {
        // Usa o modal de palestrantes existente ou cria um dinâmico
        // Para simplificar e manter o padrão do Claude, vamos assumir que existe um 'modal-speaker'
        // Se não existir, vamos injetar um modal "on the fly" para garantir o funcionamento
        
        let speakerModal = document.getElementById('modal-speaker-detail');
        
        // Se o modal de detalhe não existir no HTML, cria agora
        if (!speakerModal) {
            speakerModal = document.createElement('div');
            speakerModal.id = 'modal-speaker-detail';
            speakerModal.className = 'modal-overlay';
            speakerModal.style.zIndex = '2000'; // ACIMA do modal de sessão
            speakerModal.innerHTML = `
                <div class="modal-content">
                    <button class="modal-close" onclick="fecharModalPalestrante()">&times;</button>
                    <div class="speaker-detail-content">
                        <img id="spk-img" src="" alt="" class="speaker-detail-img">
                        <h2 id="spk-name"></h2>
                        <p id="spk-role" class="speaker-role"></p>
                        <div id="spk-bio" class="speaker-bio"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(speakerModal);
        }

        // Popula
        speakerModal.querySelector('#spk-img').src = palestranteEncontrado.foto || 'assets/default-user.png';
        speakerModal.querySelector('#spk-name').textContent = palestranteEncontrado.nome;
        speakerModal.querySelector('#spk-role').textContent = palestranteEncontrado.cargo;
        speakerModal.querySelector('#spk-bio').textContent = palestranteEncontrado.bio || 'Bio não disponível.';

        speakerModal.classList.add('active');
    }
}

function fecharModalSessao() {
    const modal = document.getElementById('modal-schedule');
    if(modal) modal.classList.remove('active');
    // Só destrava o scroll se não tiver outro modal aberto
    if (!document.getElementById('modal-speaker-detail')?.classList.contains('active')) {
        document.body.style.overflow = '';
    }
}

function fecharModalPalestrante() {
    const modal = document.getElementById('modal-speaker-detail');
    if(modal) modal.classList.remove('active');
    // Não mexemos no overflow aqui porque o modal de sessão ainda está embaixo
}

function setupModalListeners() {
    // Fecha ao clicar fora
    window.onclick = function(event) {
        const modalSessao = document.getElementById('modal-schedule');
        const modalSpeaker = document.getElementById('modal-speaker-detail');
        
        if (event.target == modalSpeaker) {
            fecharModalPalestrante();
        } else if (event.target == modalSessao) {
            fecharModalSessao();
        }
    }

    // Botão fechar do modal de sessão (original do HTML)
    const closeBtn = document.querySelector('.modal-close');
    if(closeBtn) closeBtn.onclick = fecharModalSessao;
}
