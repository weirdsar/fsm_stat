import React, { useState, useEffect } from 'react';
import { getPlayers } from '../modules/db_module';
import { validateDate, validateUniqueSlots } from '../modules/validation_module';
import { MAX_PLAYERS } from '../utils/constants';

function SetupTab({ onStartGame }) {
  const [allPlayers, setAllPlayers] = useState([]);
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [tournament, setTournament] = useState('');
  const [stage, setStage] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [gameNumber, setGameNumber] = useState('');
  
  const [selectedSlots, setSelectedSlots] = useState(
    Array(MAX_PLAYERS).fill(null).map((_, index) => ({
      slot: index + 1,
      nickname: '',
      playerId: null
    }))
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = () => {
    const playersData = getPlayers();
    setAllPlayers(playersData);
  };

  const handleSlotClick = (slotIndex) => {
    setCurrentSlot(slotIndex);
    setSearchQuery('');
    setShowPlayerPicker(true);
  };

  const handlePlayerSelect = (player) => {
    if (currentSlot !== null) {
      const newSlots = [...selectedSlots];
      newSlots[currentSlot] = {
        ...newSlots[currentSlot],
        nickname: player.nickname,
        playerId: player.id
      };
      setSelectedSlots(newSlots);
      setShowPlayerPicker(false);
      setCurrentSlot(null);
    }
  };

  const handleClearSlot = (slotIndex) => {
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      nickname: '',
      playerId: null
    };
    setSelectedSlots(newSlots);
  };

  const handleAutoShuffle = () => {
    // Получить игроков, которые еще не выбраны
    const usedPlayerIds = new Set(selectedSlots.filter(s => s.playerId).map(s => s.playerId));
    const availablePlayers = allPlayers.filter(p => !usedPlayerIds.has(p.id));

    if (availablePlayers.length < 10) {
      alert('Недостаточно игроков для автоматической рассадки. Добавьте игроков в разделе "Админ".');
      return;
    }

    // Перемешать доступных игроков
    const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
    
    const newSlots = Array(MAX_PLAYERS).fill(null).map((_, index) => ({
      slot: index + 1,
      nickname: shuffled[index].nickname,
      playerId: shuffled[index].id
    }));

    setSelectedSlots(newSlots);
  };

  const handleStartGame = () => {
    const validationErrors = [];

    // Валидация даты
    const dateValidation = validateDate(gameDate);
    if (!dateValidation.valid) {
      validationErrors.push(dateValidation.error);
    }

    // Проверка заполнения всех слотов
    const filledSlots = selectedSlots.filter(s => s.nickname).length;
    if (filledSlots !== MAX_PLAYERS) {
      validationErrors.push(`Не все слоты заполнены (заполнено: ${filledSlots}/${MAX_PLAYERS})`);
    }

    // Проверка уникальности игроков
    const uniqueValidation = validateUniqueSlots(selectedSlots.filter(s => s.nickname));
    if (!uniqueValidation.valid) {
      validationErrors.push(uniqueValidation.error);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Подготовка данных для игры
    const gameData = {
      gameDate,
      tournament: tournament || 'Фан-игра',
      stage: stage || '-',
      tableNumber: tableNumber || '1',
      gameNumber: gameNumber || '1',
      players: selectedSlots.map(slot => ({
        slot: slot.slot,
        nickname: slot.nickname,
        playerId: slot.playerId,
        role: '',
        fouls: 0,
        techFouls: 0,
        bonusPoints: 0,
        penaltyPoints: 0,
        points: 0,
        pu: 0,
        ss: false,
        vskr: false,
        isFirstKilled: false
      })),
      votings: Array(6).fill(null).map((_, index) => ({
        number: index + 1,
        candidates: [],
        votes: [],
        revotes: []
      })),
      shootings: Array(7).fill(null).map((_, index) => ({
        night: index === 0 ? 'first' : index,
        value: '',
        playerNumber: null
      })),
      bestMove: {
        numbers: '',
        firstKilledSlot: null
      },
      winnerTeam: '',
      opinion: ''
    };

    setErrors([]);
    onStartGame(gameData);
  };

  const filteredPlayers = allPlayers.filter(p =>
    p.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="setup-tab">
      <div className="card">
        <div className="card-header">Настройка игры</div>

        {/* Метаданные игры */}
        <div className="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Дата игры *</label>
            <input
              type="date"
              className="form-control"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Турнир</label>
            <input
              type="text"
              className="form-control"
              value={tournament}
              onChange={(e) => setTournament(e.target.value)}
              placeholder="Название турнира..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Стадия</label>
            <input
              type="text"
              className="form-control"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder="Этап..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Стол №</label>
            <input
              type="text"
              className="form-control"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Игра №</label>
            <input
              type="text"
              className="form-control"
              value={gameNumber}
              onChange={(e) => setGameNumber(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>

        {/* Выбор игроков */}
        <div className="card-header" style={{ marginTop: '1rem' }}>
          <div className="d-flex justify-content-between align-items-center">
            <span>Игроки (выберите 10)</span>
            <button className="btn btn-secondary" onClick={handleAutoShuffle}>
              🎲 Авто-рассадка
            </button>
          </div>
        </div>

        <div className="slots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          {selectedSlots.map((slot, index) => (
            <div
              key={slot.slot}
              className="slot-card"
              style={{
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                padding: '1rem',
                cursor: 'pointer',
                backgroundColor: slot.nickname ? '#e7f3ff' : 'white',
                transition: 'all 0.2s'
              }}
              onClick={() => handleSlotClick(index)}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Слот {slot.slot}
              </div>
              {slot.nickname ? (
                <div>
                  <div style={{ fontSize: '1.1rem', color: '#667eea' }}>
                    {slot.nickname}
                  </div>
                  <button
                    className="btn btn-danger"
                    style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem', width: '100%' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSlot(index);
                    }}
                  >
                    Очистить
                  </button>
                </div>
              ) : (
                <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                  Нажмите для выбора
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ошибки валидации */}
        {errors.length > 0 && (
          <div className="alert alert-danger mt-3">
            <strong>Ошибки:</strong>
            <ul style={{ marginBottom: 0, marginTop: '0.5rem' }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Кнопка старта */}
        <div className="mt-3 text-center">
          <button
            className="btn btn-success"
            style={{ fontSize: '1.25rem', padding: '0.75rem 2rem' }}
            onClick={handleStartGame}
          >
            ▶ Старт игры
          </button>
        </div>
      </div>

      {/* Модальное окно выбора игрока */}
      {showPlayerPicker && (
        <div className="modal-overlay" onClick={() => setShowPlayerPicker(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              Выберите игрока для слота {currentSlot !== null ? currentSlot + 1 : ''}
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Поиск по нику..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredPlayers.length === 0 ? (
                <div className="text-center" style={{ padding: '2rem', color: '#6c757d' }}>
                  {searchQuery ? 'Игроки не найдены' : 'Нет игроков. Добавьте в разделе "Админ".'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredPlayers.map(player => {
                    const isSelected = selectedSlots.some(s => s.playerId === player.id);
                    return (
                      <button
                        key={player.id}
                        className="btn btn-secondary"
                        style={{
                          textAlign: 'left',
                          opacity: isSelected ? 0.5 : 1,
                          cursor: isSelected ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => !isSelected && handlePlayerSelect(player)}
                        disabled={isSelected}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{player.nickname}</span>
                          <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                            {player.games_count} игр, {player.win_percentage}% побед
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPlayerPicker(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SetupTab;
