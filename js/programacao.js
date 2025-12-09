/* PROGRAMAÇÃO JS - V FINAL (MODAL SOBRE MODAL) */

document.addEventListener('DOMContentLoaded', () => {
    if(window.programacaoManager) window.programacaoManager.init();
});

class ProgramacaoManager {
  constructor() {
    this.container = document.getElementById('programacaoGrid'); // Se usar grid antigo
    // Ou os containers novos se for o layout da programação científica
    this.init();
  }

  async init() {
    // Carrega dados iniciais se necessário
    // (Mantive compatibilidade com sua estrutura de classes)
  }
  
  // Função chamada pelo HTML ou Listeners para abrir detalhes da sessão
  async openSessaoModal(sessao) {
    // Carrega palestrantes para cruzar dados (fotos, bios)
    let palestrantesData = {};
    try {
        const pData = await Utils.JSONLoader.load('palestrantes.json');
        // Cria mapa para busca rápida por ID ou Código
        pData.palestrantes.forEach(p => {
            if(p.id) palestrantesData[p.id] = p;
            if(p.codigo) palestrantesData[p.codigo] = p;
        });
    } catch(e) { console.warn("Erro ao carregar palestrantes para o modal", e); }

    const labelMap = { 'keynote': 'Palestra Magna', 'roundtable': 'Mesa Redonda', 'symposium': 'Simpósio', 'workshop': 'Workshop', 'conference': 'Conferência' };
    const tipoLabel = labelMap[sessao.tipo] || sessao.tipo;

    // HTML DO MODAL DE SESSÃO
    const content = `
      <div class="modal-hero" style="background-image: linear-gradient(135deg, var(--primary), var(--primary-dark));">
         <div style="position:relative; z-index:2; width:100%">
            <span style="background:rgba(255,255,255,0.2); padding: 4px 10px; border-radius:4px; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">
                ${tipoLabel}
            </span>
            <h2 style="margin-top:10px; font-size:1.5rem; line-height:1.2;">${sessao.titulo}</h2>
         </div>
      </div>

      <div class="modal-body">
         <div style="display:flex; gap:20px; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:20px; color:#666;">
            <div>🕒 ${sessao.horario_inicio} - ${sessao.horario_fim}</div>
            <div>📍 ${sessao.sala || 'A definir'}</div>
         </div>

         ${sessao.descricao ? `<p style="margin-bottom:20px; color:#444">${sessao.descricao}</p>` : ''}

         ${this.renderParticipantesBloco('Moderador(es)', sessao.moderadores, palestrantesData)}
         
         ${this.renderParticipantesBloco('Debatedores / Palestrantes', sessao.debatedores, palestrantesData)}

         ${this.renderAulas(sessao.aulas, palestrantesData)}

      </div>
    `;

    Utils.Modal.open(content);
  }

  // Helper para renderizar lista de pessoas com clique
  renderParticipantesBloco(titulo, lista, pData) {
    if (!lista || lista.length === 0) return '';
    
    // Filtra nulls ou indefinidos
    const validos = lista.filter(p => p && (p.nome || p.palestrante_nome));
    if (validos.length === 0) return '';

    let html = `<h3 style="font-size:1.1rem; color:var(--primary); margin: 20px 0 10px;">${titulo}</h3>`;
    html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">`;

    validos.forEach(pessoa => {
        // Tenta achar link com cadastro completo
        const pID = pessoa.palestrante_id || pessoa.id || pessoa.codigo;
        const dadosCompletos = pData[pID]; // Tenta achar no JSON de palestrantes
        
        const foto = dadosCompletos?.foto || pessoa.foto || pessoa.palestrante_foto || 'assets/default-user.png';
        const nome = dadosCompletos?.nome || pessoa.nome || pessoa.palestrante_nome;
        const instituicao = dadosCompletos?.instituicao || pessoa.instituicao || '';
        
        // Verifica se tem ID para clique
        const clickAttr = pID ? `onclick="window.programacaoManager.openPalestranteModal('${pID}')"` : '';
        const cursorStyle = pID ? 'cursor:pointer;' : '';

        html += `
            <div style="display:flex; align-items:center; gap:10px; background:#f8f9fa; padding:10px; border-radius:8px; ${cursorStyle} transition:transform 0.2s;" 
                 ${clickAttr}
                 onmouseover="this.style.background='#e9ecef'" 
                 onmouseout="this.style.background='#f8f9fa'">
                <img src="${foto}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid #ddd;" onerror="this.src='https://placehold.co/40?text=user'">
                <div>
                    <div style="font-weight:700; font-size:0.9rem; line-height:1.2;">${nome}</div>
                    ${instituicao ? `<div style="font-size:0.75rem; color:#777;">${instituicao}</div>` : ''}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    return html;
  }

  renderAulas(aulas, pData) {
      if(!aulas || aulas.length === 0) return '';
      
      let html = `<h3 style="font-size:1.1rem; color:var(--primary); margin: 25px 0 10px;">Programação Detalhada</h3>`;
      html += `<div style="display:flex; flex-direction:column; gap:10px;">`;
      
      aulas.forEach(aula => {
          const pID = aula.palestrante_id;
          const nomePalestrante = aula.palestrante_nome || aula.palestrante;
          
          // Link clicável se tiver ID
          let palestranteHTML = `<span style="color:#666">${nomePalestrante || ''}</span>`;
          if(pID && nomePalestrante) {
              palestranteHTML = `<a href="javascript:void(0)" onclick="window.programacaoManager.openPalestranteModal('${pID}')" style="color:var(--primary); text-decoration:none; font-weight:600;">${nomePalestrante}</a>`;
          }

          html += `
            <div style="border-left:3px solid var(--accent); padding-left:15px; background:#fff;">
                <div style="font-size:0.8rem; font-weight:bold; color:var(--accent);">${aula.horario_inicio} - ${aula.horario_fim}</div>
                <div style="font-weight:600; margin:2px 0;">${aula.titulo}</div>
                ${nomePalestrante ? `<div style="font-size:0.85rem;">${palestranteHTML}</div>` : ''}
            </div>
          `;
      });
      html += `</div>`;
      return html;
  }

  // --- AQUI ESTÁ O MODAL NIVEL 2 (O QUE ABRE POR CIMA) ---
  async openPalestranteModal(id) {
    try {
        const data = await Utils.JSONLoader.load('palestrantes.json');
        const palestrante = data.palestrantes.find(p => p.id === id || p.codigo === id);
        
        if (!palestrante) {
            Utils.showToast('Perfil não encontrado.', 'warning');
            return;
        }

        // Gera o HTML do perfil usando a função padronizada
        const modalContent = this.gerarHTMLPerfil(palestrante);
        
        // Abre NOVO modal (o Utils agora empilha automaticamente)
        Utils.Modal.open(modalContent);

    } catch (e) {
        console.error(e);
        Utils.showToast('Erro ao carregar perfil.', 'error');
    }
  }

  // HTML Padronizado do Perfil (Usado aqui e na página de palestrantes)
  gerarHTMLPerfil(p) {
      return `
        <div class="modal-hero" style="background: linear-gradient(to right, #2c3e50, #4ca1af); height:150px; align-items:center; padding-left: 30px;">
             <div style="position: absolute; bottom: -40px; left: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border-radius: 50%; border: 4px solid white;">
                <img src="${p.foto}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; display:block;" onerror="this.src='https://placehold.co/100?text=Foto'">
             </div>
        </div>
        
        <div class="modal-body" style="padding-top: 50px;"> <h2 style="font-size:1.8rem; color:var(--primary); margin-bottom:5px;">${p.nome}</h2>
             <p style="color:#666; font-size:1.1rem; margin-bottom:15px; font-weight:500;">${p.especialidade || ''}</p>
             
             <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:25px;">
                ${p.instituicao ? `<span style="background:#f1f2f6; padding:5px 10px; border-radius:4px; font-size:0.85rem;">🏥 ${p.instituicao}</span>` : ''}
                ${p.cidade ? `<span style="background:#f1f2f6; padding:5px 10px; border-radius:4px; font-size:0.85rem;">📍 ${p.cidade}/${p.estado}</span>` : ''}
             </div>

             <h3 style="font-size:1.2rem; border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:15px;">Sobre</h3>
             <div style="line-height:1.6; color:#444; font-size:1rem;">
                ${p.curriculo_completo || p.mini_cv || 'Sem informações curriculares adicionais.'}
             </div>
        </div>
      `;
  }
}

// Inicializa globalmente para os onclicks funcionarem
window.programacaoManager = new ProgramacaoManager();
