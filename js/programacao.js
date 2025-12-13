// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let ACTIVE_DAY_NUMBER = 0;
let ALL_PROGRAM_DAYS = [];
const displayContainer = document.getElementById('schedule-display');
const sessionModal = document.getElementById('session-modal');
const speakerModal = document.getElementById('speaker-modal');

// ============================================
// FUNÇÕES DE MODAL (SESSÃO)
// ============================================
function closeModal() {
    sessionModal.close();
}

function openModal() {
    sessionModal.addEventListener('click', function handler(e) {
        const rect = sessionModal.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right ||
            e.clientY < rect.top || e.clientY > rect.bottom) {
            sessionModal.close();
            sessionModal.removeEventListener('click', handler);
        }
    });
    sessionModal.showModal();
}

// ============================================
// FUNÇÕES DE MODAL (PALESTRANTE - STACKABLE)
// ============================================
function closeSpeakerModal() {
    speakerModal.close();
}

function openSpeakerProfile(encodedSpeakerData) {
    const speaker = JSON.parse(decodeURIComponent(encodedSpeakerData));
    
    const photoEl = document.getElementById('speaker-photo');
    const nameEl = document.getElementById('speaker-name');
    const institutionEl = document.getElementById('speaker-institution');
    const curriculumEl = document.getElementById('speaker-curriculum');

    // Placeholder para foto ausente (SVG inline base64)
    const placeholderPhoto = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"%3E%3Crect fill="%23cbd5e0" width="160" height="160"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%234a5568" font-family="Arial, sans-serif" font-size="14" font-weight="600"%3ESem Foto%3C/text%3E%3C/svg%3E';
    
    photoEl.src = speaker.foto || placeholderPhoto;
    photoEl.alt = `Foto de ${speaker.nome || 'Palestrante'}`;
    nameEl.innerText = speaker.nome || 'Nome Indisponível';
    institutionEl.innerText = speaker.instituicao || speaker.cidade || 'Instituição não informada';
    
    // Placeholder para currículo ausente
    let curriculumText = speaker.curriculo || 'Informações em breve...';
    curriculumEl.innerHTML = curriculumText.split('\n').map(line => `<p>${line}</p>`).join('');
    
    speakerModal.showModal();
}

// ============================================
// RENDERIZA LISTA DE PARTICIPANTES (CLICÁVEL)
// ============================================
function renderParticipantsList(participants, role) {
    if (!participants || participants.length === 0) {
        return '';
    }

    const validParticipants = participants.filter(p => p.nome);

    if (validParticipants.length === 0) {
        return '';
    }

    const listItems = validParticipants.map(p => {
        const speakerJsonString = encodeURIComponent(JSON.stringify(p));
        return `
            <li>
                <strong>${role}:</strong> 
                <button class="speaker-btn" onclick="openSpeakerProfile('${speakerJsonString}')">
                    ${p.nome}
                </button>
            </li>
        `;
    }).join('');

    return listItems;
}

// ============================================
// INICIALIZAÇÃO
// ============================================
function initSchedule(data) {
    ALL_PROGRAM_DAYS = data.map(day => {
        const sessionsByRoom = day.sessoes.reduce((acc, session) => {
            const roomName = session.sala || 'Sala Não Definida';
            if (!acc[roomName]) {
                acc[roomName] = [];
            }
            acc[roomName].push(session);
            return acc;
        }, {});

        for (const room in sessionsByRoom) {
            sessionsByRoom[room].sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));
        }

        return {
            numero: day.numero,
            data: day.data,
            dia_semana: day.dia_semana,
            layout: day.layout || 'list',
            sessionsByRoom: sessionsByRoom,
            allSessions: day.sessoes
        };
    });

    if (ALL_PROGRAM_DAYS.length > 0) {
        ACTIVE_DAY_NUMBER = ALL_PROGRAM_DAYS[0].numero;
        renderDayNavigation(ALL_PROGRAM_DAYS);
        document.getElementById('search-input').addEventListener('input', filterAndDisplaySchedule);
        filterAndDisplaySchedule();
    } else {
        displayContainer.innerHTML = '<div class="empty-state"><p>Programação vazia.</p></div>';
    }
}

// ============================================
// NAVEGAÇÃO DE DIAS
// ============================================
function renderDayNavigation(days) {
    const navContainer = document.getElementById('days-nav');
    navContainer.innerHTML = '';

    days.forEach((day) => {
        const isActive = day.numero === ACTIVE_DAY_NUMBER;
        const btn = document.createElement('button');
        btn.className = `day-btn ${isActive ? 'active' : ''}`;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 6px; vertical-align: middle;">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${day.data} - ${day.dia_semana}
        `;
        btn.onclick = (e) => {
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            ACTIVE_DAY_NUMBER = day.numero;
            filterAndDisplaySchedule();
        };
        navContainer.appendChild(btn);
    });
}

// ============================================
// FILTRO E DISPLAY
// ============================================
function filterAndDisplaySchedule() {
    const selectedDay = ALL_PROGRAM_DAYS.find(d => d.numero === ACTIVE_DAY_NUMBER);
    if (!selectedDay) return;

    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    let filteredSessions = selectedDay.allSessions;

    if (searchTerm) {
        filteredSessions = filteredSessions.filter(session => {
            const sessionText = [
                session.titulo,
                session.grade,
                session.sala,
                ...(session.moderadores || []).map(m => m.nome),
                ...(session.debatedores || []).map(d => d.nome),
                ...(session.aulas || []).flatMap(aula => (aula.palestrantes || []).map(p => p.nome)),
                ...(session.nucleo_jovem || []).map(p => p.nome),
                ...(session.aulas || []).map(aula => aula.titulo_aula || aula.titulo)
            ].join(' ').toLowerCase();

            return sessionText.includes(searchTerm);
        });
    }

    renderFilteredResults(selectedDay, filteredSessions);
}

// ============================================
// RENDERIZA RESULTADOS FILTRADOS
// ============================================
function renderFilteredResults(day, sessions) {
    displayContainer.innerHTML = '';

    if (sessions.length === 0) {
        displayContainer.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma sessão encontrada para os critérios aplicados no dia ${day.data}.</p>
            </div>
        `;
        return;
    }

    const sessionsByRoomFiltered = sessions.reduce((acc, session) => {
        const roomName = session.sala || 'Sala Não Definida';
        if (!acc[roomName]) {
            acc[roomName] = [];
        }
        acc[roomName].push(session);
        return acc;
    }, {});

    const roomNames = Object.keys(sessionsByRoomFiltered).sort();

    roomNames.forEach(roomName => {
        const sessionsInRoom = sessionsByRoomFiltered[roomName];

        let roomHTML = `
            <div class="room-group">
                <h3 class="room-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${roomName}
                </h3>
                <div class="sessions-container">
        `;

        roomHTML += sessionsInRoom.map(session => renderSessionCard(session)).join('');
        roomHTML += `</div></div>`;
        displayContainer.insertAdjacentHTML('beforeend', roomHTML);
    });
}

// ============================================
// RENDERIZA CARD DE SESSÃO
// ============================================
function renderSessionCard(session) {
    const moderators = (session.moderadores || []).map(m => m.nome).filter(Boolean);
    const debatedores = (session.debatedores || []).map(d => d.nome).filter(Boolean);
    const speakers = (session.aulas || []).flatMap(aula => (aula.palestrantes || []).map(p => p.nome)).filter(Boolean);

    const allNames = new Set([...moderators, ...debatedores, ...speakers]);
    const allParticipants = Array.from(allNames);
    
    const participantsText = allParticipants.length > 0 
        ? allParticipants.slice(0, 3).join(', ') + (allParticipants.length > 3 ? '...' : '')
        : 'Participantes: A definir';

    const sessionJsonString = encodeURIComponent(JSON.stringify(session));

    const horarioInicio = session.horario_inicio ? session.horario_inicio.substring(0, 5) : 'A definir';
    const horarioFim = session.horario_fim ? session.horario_fim.substring(0, 5) : 'A definir';

    return `
        <article class="session-card">
            <div class="session-content">
                <span class="session-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${horarioInicio} - ${horarioFim}
                </span>
                <h4 class="session-title">${session.titulo || 'Título A Definir'}</h4>
                <p class="session-participants">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    ${participantsText}
                </p>
            </div>
            <button class="btn-details" onclick="populateAndOpenModal('${sessionJsonString}')">
                Ver Detalhes
            </button>
        </article>
    `;
}

// ============================================
// POPULA E ABRE MODAL DE SESSÃO
// ============================================
function populateAndOpenModal(encodedSessionData) {
    const session = JSON.parse(decodeURIComponent(encodedSessionData));

    document.getElementById('modal-title').innerText = session.titulo || 'Detalhes da Sessão';

    const modalidade = session.modalidade || 'Modalidade A Definir';
    const horarioInicio = session.horario_inicio ? session.horario_inicio.substring(0, 5) : 'A definir';
    const horarioFim = session.horario_fim ? session.horario_fim.substring(0, 5) : 'A definir';

    // NOVO: Agrupando Moderadores, Debatedores e Núcleo Jovem JUNTOS
    const moderadoresHTML = renderParticipantsList(session.moderadores, 'Moderador(a)');
    const debatedoresHTML = renderParticipantsList(session.debatedores, 'Debatedor(es)');
    const nucleoJovemHTML = renderParticipantsList(session.nucleo_jovem, 'Núcleo Jovem');

    // Monta o HTML da Mesa apenas se houver participantes
    const mesaHTML = (moderadoresHTML || debatedoresHTML || nucleoJovemHTML)
        ? `
            <div class="mesa-box">
                <h5 class="mesa-box-title">Integrantes da Mesa</h5>
                <p class="mesa-box-subtitle">Clique no convidado para ver detalhes</p>
                <ul class="mesa-list">
                    ${moderadoresHTML}
                    ${debatedoresHTML}
                    ${nucleoJovemHTML}
                </ul>
            </div>
        `
        : '';

    // Lista de Aulas/Cronograma
    const aulasHTML = (session.aulas && session.aulas.length > 0)
        ? session.aulas.map(aula => {
            let aulaParticipantsHTML = '';
            if (aula.palestrantes && aula.palestrantes.length > 0) {
                aulaParticipantsHTML = aula.palestrantes.map(p => {
                    const speakerJsonString = encodeURIComponent(JSON.stringify(p));
                    return `
                        <button class="speaker-btn" onclick="openSpeakerProfile('${speakerJsonString}')" style="margin-top: 6px; display: block;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px; vertical-align: middle;">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                            ${p.nome || 'Palestrante'}
                        </button>
                    `;
                }).join('');
            }

            const aulaTitle = aula.titulo_aula || aula.titulo || 'Atividade A Definir';
            const aulaInicio = aula.horario_inicio ? aula.horario_inicio.substring(0, 5) : '';

            return `
                <li class="timeline-item">
                    <strong class="timeline-time">${aulaInicio}</strong>: ${aulaTitle}
                    ${aulaParticipantsHTML}
                </li>
            `;
        }).join('')
        : '<li class="timeline-item">Cronograma detalhado não disponível.</li>';

    const content = `
        <ul class="modal-list">
            <li><strong>Sala:</strong> ${session.sala || 'A definir'} (${modalidade})</li>
            <li><strong>Horário:</strong> ${horarioInicio} - ${horarioFim}</li>
        </ul>

        ${mesaHTML}

        <div class="timeline-section">
            <h5 class="timeline-title">📚 Cronograma Detalhado</h5>
            <ul class="timeline">${aulasHTML}</ul>
        </div>
    `;

    document.getElementById('modal-content').innerHTML = content;
    openModal();
}

// ============================================
// FETCH DO JSON
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    fetch('./data/programacao.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar programacao.json');
            }
            return response.json();
        })
        .then(data => initSchedule(data))
        .catch(error => {
            console.error('Falha na inicialização:', error);
            displayContainer.innerHTML = 
                '<div class="empty-state" style="color: #e53e3e; padding: 40px 20px;">' +
                '<p><strong>⚠️ ERRO:</strong> Não foi possível carregar a programação.</p>' +
                '<p style="font-size: 0.9rem; margin-top: 10px;">Certifique-se de que o arquivo "programacao.json" está na pasta "data/".</p>' +
                '</div>';
        });
});
