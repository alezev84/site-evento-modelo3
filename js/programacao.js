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

            // Placeholder para foto ausente
            photoEl.src = speaker.foto || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ccc" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-family="Arial" font-size="14"%3ESem Foto%3C/text%3E%3C/svg%3E';
            photoEl.alt = `Foto de ${speaker.nome || 'Palestrante'}`;
            nameEl.innerText = speaker.nome || 'Nome Indisponível';
            institutionEl.innerText = speaker.instituicao || speaker.cidade || 'Instituição não informada';
            
            // Placeholder para currículo ausente
            let curriculumText = speaker.curriculo || 'Informações em breve...';
            curriculumEl.innerHTML = curriculumText.replace(/\n/g, '<br>');
            
            speakerModal.showModal();
        }

        // ============================================
        // RENDERIZA LISTA DE PARTICIPANTES (CLICÁVEL)
        // ============================================
        function renderParticipantsList(participants, role) {
            if (!participants || participants.length === 0) {
                return `<li><strong>${role}:</strong> <small>A definir</small></li>`;
            }

            const validParticipants = participants.filter(p => p.nome);

            const listItems = validParticipants.map(p => {
                const speakerJsonString = encodeURIComponent(JSON.stringify(p));
                return `
                    <li>
                        <strong>${role}:</strong> 
                        <button class="speaker-name-btn" onclick="openSpeakerProfile('${speakerJsonString}')">
                            ${p.nome}
                        </button>
                    </li>
                `;
            }).join('');

            return listItems || `<li><strong>${role}:</strong> <small>A definir</small></li>`;
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
                displayContainer.innerHTML = '<p class="empty-state">Programação vazia.</p>';
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
                btn.innerText = `${day.data} - ${day.dia_semana}`;
                btn.onclick = (e) => {
                    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
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
                        ...(session.nucleo_jovem || []).map(p => p.nome)
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
                displayContainer.innerHTML = `<p class="empty-state">Nenhuma sessão encontrada para os critérios aplicados no dia ${day.data}.</p>`;
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
                        <h3 class="room-title">📍 ${roomName}</h3>
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
            const moderators = (session.moderadores || []).map(m => m.nome).filter(name => name);
            const debatedores = (session.debatedores || []).map(d => d.nome).filter(name => name);
            const speakers = (session.aulas || []).flatMap(aula => (aula.palestrantes || []).map(p => p.nome)).filter(name => name);

            const allNames = new Set([...moderators, ...debatedores, ...speakers]);
            const allParticipants = Array.from(allNames).join(', ');
            const participantsText = allParticipants ? allParticipants : 'Participantes: A definir';

            const sessionJsonString = encodeURIComponent(JSON.stringify(session));

            return `
                <article class="session-card">
                    <div class="session-content">
                        <span class="tag">🕐 ${session.horario_inicio?.substring(0,5) || 'A definir'} - ${session.horario_fim?.substring(0,5) || 'A definir'}</span>
                        <h4>${session.titulo || 'Título A Definir'}</h4>
                        <p>Convidados: ${participantsText}</p>
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

            // NOVO: Agrupando Moderadores, Debatedores e Núcleo Jovem JUNTOS
            const moderadoresHTML = renderParticipantsList(session.moderadores, 'Moderador(a)');
            const debatedoresHTML = renderParticipantsList(session.debatedores, 'Debatedor(es)');
            const nucleoJovemHTML = renderParticipantsList(session.nucleo_jovem, 'Núcleo Jovem');

            // Lista de Aulas/Cronograma
            const aulasHTML = (session.aulas && session.aulas.length > 0)
                ? session.aulas.map(aula => {
                    let aulaParticipantsHTML = '';
                    if (aula.palestrantes && aula.palestrantes.length > 0) {
                        aulaParticipantsHTML = aula.palestrantes.map(p => {
                            const speakerJsonString = encodeURIComponent(JSON.stringify(p));
                            return `
                                <button class="speaker-name-btn" onclick="openSpeakerProfile('${speakerJsonString}')" style="margin-top: 5px; font-size: 0.95rem; display: block;">
                                    🎤 ${p.nome || 'Palestrante'}
                                </button>
                            `;
                        }).join('');
                    }

                    const aulaTitle = aula.titulo_aula || aula.titulo || 'Atividade A Definir';

                    return `
                        <li class="timeline-item">
                            <strong>${aula.horario_inicio?.substring(0,5)}</strong>: ${aulaTitle}<br>
                            ${aulaParticipantsHTML}
                        </li>
                    `;
                }).join('')
                : '<li>Cronograma detalhado não disponível.</li>';

            const content = `
                <ul class="modal-list">
                    <li><strong>Sala:</strong> ${session.sala || 'A definir'} (${modalidade})</li>
                    <li><strong>Horário:</strong> 🕐 ${session.horario_inicio?.substring(0,5)} - ${session.horario_fim?.substring(0,5)}</li>
                </ul>

                <div class="mesa-integrantes-box">
                    <h5>
                      Integrantes da Mesa
                      <br>
                      <em>Clique no convidado para ver detalhes</em>
                    </h5>
                    <ul class="modal-list">
                      ${moderadoresHTML}
                      ${debatedoresHTML}
                      ${nucleoJovemHTML}
                    </ul>
                </div>
                <h5 style="margin-top: 20px; color: var(--primary-color);">📚 Cronograma Detalhado</h5>
            <ul class="modal-list timeline">${aulasHTML}</ul>
        `;

        document.getElementById('modal-content').innerHTML = content;
        openModal();
    }

    // ============================================
    // FETCH DO JSON
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
        fetch('./programacao.json')
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
                    '<p style="color: red; padding: 20px; text-align: center;">' +
                    '⚠️ ERRO: Não foi possível carregar a programação. ' +
                    'Certifique-se de que o arquivo "programacao.json" está no mesmo diretório.' +
                    '</p>';
            });
    });
