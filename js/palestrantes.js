document.addEventListener('DOMContentLoaded', () => {
    carregarPalestrantes();
});

async function carregarPalestrantes() {
    const container = document.getElementById('speakers-grid'); // ID do HTML do Claude

    if (!container) return;

    try {
        const response = await fetch('./palestrantes.json');
        const palestrantes = await response.json();

        container.innerHTML = '';

        palestrantes.forEach(p => {
            const card = document.createElement('div');
            card.className = 'speaker-card'; // Classe do CSS do Claude

            // TRADUÇÃO: p.foto (Planilha) -> src da imagem
            card.innerHTML = `
                <div class="speaker-image">
                    <img src="${p.foto || 'assets/default-user.png'}" alt="${p.nome}" loading="lazy" onerror="this.src='assets/default-user.png'">
                </div>
                <div class="speaker-info">
                    <h3>${p.nome}</h3>
                    <p class="speaker-role">${p.cargo}</p>
                    <p class="speaker-bio-short">${p.bio ? p.bio.substring(0, 100) + '...' : ''}</p>
                </div>
            `;
            
            // Adiciona evento de clique para abrir modal (reusa lógica se quiser)
            // Por enquanto, deixei visualização simples conforme card
            
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<p>Erro ao carregar palestrantes.</p>';
    }
}
