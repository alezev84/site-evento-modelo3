/**
 * SCRIPT DE PALESTRANTES - VERSÃO PREMIUM
 * Funcionalidades: Grid Responsivo + Modal Detalhado Dinâmico
 */

document.addEventListener('DOMContentLoaded', () => {
    carregarGradePalestrantes();
    setupListenersGlobais();
});

async function carregarGradePalestrantes() {
    // Busca o container (tenta IDs comuns)
    const container = document.getElementById('speakers-grid') || 
                      document.getElementById('palestrantes-container');

    if (!container) return; // Não estamos na página de palestrantes

    try {
        // Carrega o JSON gerado pelo GAS
        const response = await fetch('data/palestrantes.json');
        if (!response.ok) throw new Error('JSON não encontrado');
        
        const palestrantes = await response.json();
        
        // Salva globalmente para o modal acessar depois
        window.dadosPalestrantes = palestrantes;

        container.innerHTML = '';

        if (palestrantes.length === 0) {
            container.innerHTML = '<p>Nenhum palestrante encontrado.</p>';
            return;
        }

        // Renderiza os cards
        palestrantes.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'speaker-card'; // Mantém o CSS do Claude

            // HTML do Card
            card.innerHTML = `
                <div class="speaker-image">
                    <img src="${p.foto || 'assets/default-user.png'}" 
                         alt="${p.nome}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <div class="speaker-info">
                    <h3>${p.nome}</h3>
                    <p class="speaker-role">${p.cargo}</p>
                    <p class="speaker-bio-short">
                        ${p.bio ? p.bio.substring(0, 90) + '...' : ''}
                    </p>
                    <span class="view-more">Ver perfil completo &rarr;</span>
                </div>
            `;
            
            // Ao clicar, chama a função PRO que abre o modal bonito
            card.onclick = () => abrirModalPalestrante(index);
            
            container.appendChild(card);
        });

    } catch (e) {
        console.error('Erro:', e);
        container.innerHTML = '<p style="color:red; text-align:center">Erro ao carregar lista. Verifique se o arquivo data/palestrantes.json existe.</p>';
    }
}

// --- LÓGICA DO MODAL (Aqui está o "peso" que faltava) ---

function abrirModalPalestrante(index) {
    const p = window.dadosPalestrantes[index];
    if (!p) return;

    // 1. Verifica se o esqueleto do modal já existe no HTML
    let modal = document.getElementById('modal-speaker-detail');

    // 2. Se não existir, CRIA O HTML DO MODAL AGORA (Dynamic DOM)
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-speaker-detail';
        modal.className = 'modal-overlay'; // Reusa classes do CSS existente
        // Estilos inline de segurança para garantir centralização
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; width:90%; background:white; padding:30px; border-radius:12px; position:relative; animation: fadeIn 0.3s;">
                <button class="modal-close" style="position:absolute; right:15px; top:15px; border:none; background:transparent; font-size:24px; cursor:pointer;">&times;</button>
                
                <div class="speaker-full-content" style="text-align:center;">
                    <img id="modal-spk-img" src="" style="width:150px; height:150px; border-radius:50%; object-fit:cover; margin-bottom:20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    
                    <h2 id="modal-spk-name" style="margin-bottom:5px; color:#333;"></h2>
                    <p id="modal-spk-role" style="color:#666; font-style:italic; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;"></p>
                    
                    <div id="modal-spk-bio" style="text-align:left; line-height:1.6; color:#444; max-height:400px; overflow-y:auto;">
                        </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Adiciona evento de fechar no botão X criado agora
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.onclick = fecharModal;
    }

    // 3. Preenche os dados
    const img = modal.querySelector('#modal-spk-img');
    const name = modal.querySelector('#modal-spk-name');
    const role = modal.querySelector('#modal-spk-role');
    const bio = modal.querySelector('#modal-spk-bio');

    img.src = p.foto || 'assets/default-user.png';
    name.textContent = p.nome;
    role.textContent = p.cargo;
    bio.innerHTML = p.bio ? `<p>${p.bio}</p>` : '<p>Biografia não disponível.</p>';

    // 4. Mostra o modal
    modal.classList.add('active');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Trava o scroll da página
}

function fecharModal() {
    const modal = document.getElementById('modal-speaker-detail');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    document.body.style.overflow = ''; // Destrava scroll
}

function setupListenersGlobais() {
    // Fecha ao clicar fora do conteúdo (no fundo escuro)
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modal-speaker-detail');
        if (e.target === modal) {
            fecharModal();
        }
    });

    // Fecha com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fecharModal();
        }
    });
}
