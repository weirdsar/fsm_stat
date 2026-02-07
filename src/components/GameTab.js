import React, { useState, useEffect } from 'react';
import PlayerRow from './PlayerRow';
import VotingBlock from './VotingBlock';
import { saveGame, updatePlayerStats } from '../modules/db_module';
import { exportProtocolToPDF } from '../modules/export_module';
import { 
  calculateBestMove, 
  calculatePlayerPoints, 
  autoFillRoles, 
  validateRoles,
  getAlivePlayers
} from '../modules/logic_module';
import { 
  validateProtocol, 
  generateWarnings, 
  validateShooting 
} from '../modules/validation_module';
import { TEAMS } from '../utils/constants';

function GameTab({ gameData, onNewGame }) {
  const [players, setPlayers] = useState(gameData.players);
  const [votings, setVotings] = useState(gameData.votings);
  const [shootings, setShootings] = useState(gameData.shootings);
  const [bestMove, setBestMove] = useState(gameData.bestMove);
  const [winnerTeam, setWinnerTeam] = useState(gameData.winnerTeam);
  const [opinion, setOpinion] = useState(gameData.opinion);
  const [rolesLocked, setRolesLocked] = useState(false);

  // Автоматический расчет баллов при изменении данных
  useEffect(() => {
  recalculatePoints();
}, [players, bestMove, winnerTeam]);

  const recalculatePoints = () => {
    if (!winnerTeam || !rolesLocked) return;

    // Расчет ЛХ для первого убитого
    let bestMoveData = { bonus: 0, pu: 0, applied: false };
    
    if (bestMove.firstKilledSlot && bestMove.numbers) {
      bestMoveData = calculateBestMove(bestMove.numbers, players, bestMove.firstKilledSlot);
    }

    // Обновление баллов для всех игроков
    const updatedPlayers = players.map(player => {
      const isFirstKilled = player.slot === bestMove.firstKilledSlot;
      const playerWithFlag = { ...player, isFirstKilled };
      
      const points = calculatePlayerPoints(playerWithFlag, winnerTeam, bestMoveData);
      
      return {
        ...player,
        points,
        pu: isFirstKilled ? bestMoveData.pu : 0
      };
    });

    setPlayers(updatedPlayers);
  };

  const handlePlayerUpdate = (updatedPlayer) => {
    const newPlayers = players.map(p =>
      p.slot === updatedPlayer.slot ? updatedPlayer : p
    );
    setPlayers(newPlayers);

    // Автозаполнение ролей
    const autoFilled = autoFillRoles(newPlayers);
    if (JSON.stringify(autoFilled) !== JSON.stringify(newPlayers)) {
      setPlayers(autoFilled);
    }
  };

  const handleVotingUpdate = (votingNumber, updatedVoting) => {
    const newVotings = votings.map(v =>
      v.number === votingNumber ? updatedVoting : v
    );
    setVotings(newVotings);
  };

  const handleShootingChange = (index, value) => {
    const validation = validateShooting(value);
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const newShootings = [...shootings];
    newShootings[index] = {
      ...newShootings[index],
      value: value,
      playerNumber: validation.playerNumber
    };

    setShootings(newShootings);

    // Если это первый отстрел, обновить bestMove.firstKilledSlot
    if (index === 0 && validation.playerNumber) {
      setBestMove({
        ...bestMove,
        firstKilledSlot: validation.playerNumber
      });
    }
  };

  const handleBestMoveChange = (value) => {
    setBestMove({
      ...bestMove,
      numbers: value
    });
  };

  const handleLockRoles = () => {
    const validation = validateRoles(players);
    
    if (!validation.valid) {
      alert('Ошибки в ролях:\n\n' + validation.errors.join('\n'));
      return;
    }

    setRolesLocked(true);
    alert('Роли зафиксированы. Теперь можно выбрать победителя и произвести расчеты.');
  };

  const handleSaveProtocol = async () => {
    // Валидация протокола
    const protocolData = {
      gameDate: gameData.gameDate,
      players,
      votings,
      shootings,
      bestMove,
      winnerTeam
    };

    const validation = validateProtocol(protocolData);
    
    if (!validation.valid) {
      alert('Ошибки валидации:\n\n' + validation.errors.join('\n'));
      return;
    }

    // Предупреждения
    const alivePlayers = getAlivePlayers(players, votings, shootings);
    const warnings = generateWarnings(protocolData, alivePlayers);
    
    if (warnings.length > 0) {
      const proceed = window.confirm(
        'Обнаружены предупреждения:\n\n' + 
        warnings.join('\n') + 
        '\n\nПродолжить сохранение?'
      );
      
      if (!proceed) return;
    }

    // Сохранение игры
    const gameToSave = {
      gameDate: gameData.gameDate,
      tournament: gameData.tournament,
      stage: gameData.stage,
      tableNumber: gameData.tableNumber,
      gameNumber: gameData.gameNumber,
      winnerTeam,
      protocolJson: {
        players,
        votings,
        shootings,
        bestMove,
        opinion
      }
    };

    const saveResult = await saveGame(gameToSave);
    
    if (!saveResult.success) {
      alert('Ошибка сохранения игры: ' + saveResult.error);
      return;
    }

    // Обновление статистики игроков
    for (const player of players) {
      const playerTeam = (player.role === 'Мафия' || player.role === 'Дон') ? 'Мафия' : 'Мирные';
      const won = playerTeam === winnerTeam;
      
      await updatePlayerStats(
        player.nickname,
        won,
        player.points,
        parseFloat(player.bonusPoints) || 0,
        parseFloat(player.penaltyPoints) || 0
      );
    }

    alert('Протокол сохранен успешно!');
    
    const startNew = window.confirm('Начать новую игру?');
    if (startNew) {
      onNewGame();
    }
  };

  const handleExportPDF = () => {
    if (!rolesLocked || !winnerTeam) {
      alert('Зафиксируйте роли и выберите победителя перед экспортом');
      return;
    }

    const protocolData = {
      players,
      votings,
      shootings,
      bestMove,
      winnerTeam,
      opinion
    };

    exportProtocolToPDF(gameData, protocolData);
  };

  const alivePlayers = getAlivePlayers(players, votings, shootings);

  return (
    <div className="game-tab">
      {/* Хедер с информацией об игре */}
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <strong>Игра:</strong> {gameData.tournament} | {gameData.stage} | 
            Стол {gameData.tableNumber} | Игра {gameData.gameNumber} | 
            Дата: {new Date(gameData.gameDate).toLocaleDateString('ru-RU')}
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-secondary" onClick={onNewGame}>
              ← Новая игра
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleExportPDF}
              disabled={!rolesLocked || !winnerTeam}
            >
              📄 Экспорт PDF
            </button>
            <button 
              className="btn btn-success" 
              onClick={handleSaveProtocol}
              disabled={!rolesLocked || !winnerTeam}
            >
              💾 Сохранить протокол
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Левая колонка: Таблица игроков */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>Игроки</span>
            {!rolesLocked && (
              <button className="btn btn-primary" onClick={handleLockRoles}>
                🔒 Зафиксировать роли
              </button>
            )}
            {rolesLocked && (
              <span className="text-success">✓ Роли зафиксированы</span>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>№</th>
                  <th>Игрок</th>
                  <th style={{ width: '120px' }}>Роль</th>
                  <th style={{ width: '60px' }}>Фолы</th>
                  <th style={{ width: '140px' }}>Тех фолы</th>
                  <th style={{ width: '70px' }}>Баллы</th>
                  <th style={{ width: '70px' }}>Доп +</th>
                  <th style={{ width: '70px' }}>Доп --</th>
                  <th style={{ width: '180px' }}>ПУ/СС/ВСКР</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <PlayerRow
                    key={player.slot}
                    player={player}
                    onUpdate={handlePlayerUpdate}
                    disabled={rolesLocked}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2" style={{ padding: '0 1rem', fontSize: '0.875rem', color: '#6c757d' }}>
            Живых игроков: {alivePlayers.length}
          </div>
        </div>

        {/* Правая колонка: Голосования */}
        <div className="card">
          <div className="card-header">Голосования</div>
          <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '1rem' }}>
            {votings.map(voting => (
              <VotingBlock
                key={voting.number}
                voting={voting}
                onUpdate={(updated) => handleVotingUpdate(voting.number, updated)}
                aliveCount={alivePlayers.length}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Нижняя секция: Отстрелы, ЛХ, Победитель, Мнение */}
      <div className="card mt-3">
        <div className="card-header">Отстрелы и результаты</div>

        <div style={{ padding: '1rem' }}>
          {/* Первый отстрел */}
          <div className="form-group">
            <label className="form-label">
              Первый отстрел - Игрок №
              <span className="tooltip-icon" title="Номер первого убитого игрока (для расчета ЛХ)">?</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={shootings[0].value}
              onChange={(e) => handleShootingChange(0, e.target.value)}
              placeholder="Номер (1-10) или символ промаха (*,х,П,пр)"
              style={{ maxWidth: '300px' }}
            />
          </div>

          {/* Стрельба (6 ночей) */}
          <div className="form-group mt-3">
            <label className="form-label">
              Стрельба (ночи 1-6)
              <span className="tooltip-icon" title="Введите номера убитых или символы промаха">?</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5, 6].map(night => (
                <div key={night}>
                  <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                    Ночь {night}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={shootings[night].value}
                    onChange={(e) => handleShootingChange(night, e.target.value)}
                    placeholder={night === 1 ? '№' : '-'}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Лучший ход */}
          <div className="form-group mt-3">
            <label className="form-label">
              Лучший ход (ЛХ)
              <span className="tooltip-icon" title="Номера черных через запятую. +0.25 за 1, +0.5 за 2, +0.8 за 3 угаданных">?</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={bestMove.numbers}
              onChange={(e) => handleBestMoveChange(e.target.value)}
              placeholder="Номера черных через запятую (например: 2, 5, 8)"
              style={{ maxWidth: '400px' }}
            />
            {bestMove.firstKilledSlot && (
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#6c757d' }}>
                Первый убитый: Игрок № {bestMove.firstKilledSlot} ({players.find(p => p.slot === bestMove.firstKilledSlot)?.nickname})
              </div>
            )}
          </div>

          {/* Победившая команда */}
          <div className="form-group mt-3">
            <label className="form-label">Победившая команда *</label>
            <select
              className="form-control"
              value={winnerTeam}
              onChange={(e) => setWinnerTeam(e.target.value)}
              disabled={!rolesLocked}
              style={{ maxWidth: '200px' }}
            >
              <option value="">-- Выберите --</option>
              <option value={TEAMS.MAFIA}>Мафия</option>
              <option value={TEAMS.CIVILIANS}>Мирные</option>
            </select>
          </div>

          {/* Мнение / Протокол */}
          <div className="form-group mt-3">
            <label className="form-label">
              Мнение / Протокол
              <span className="tooltip-icon" title="Заметки судьи о ходе игры">?</span>
            </label>
            <textarea
              className="form-control"
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="Комментарии, наблюдения..."
              rows="6"
              style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>

      {/* Памятка */}
      <div className="card mt-3" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="card-header">Памятка</div>
        <div style={{ padding: '1rem', fontSize: '0.875rem' }}>
          <ul style={{ marginBottom: 0 }}>
            <li><strong>ПУ (0/1/2/3):</strong> Отметка количества угаданных черных в ЛХ для первого убитого</li>
            <li><strong>СС (самострел):</strong> Отметить, если черный убил черного в любую ночь</li>
            <li><strong>ВСКР (вскрытие):</strong> Отметить вскрытие Дона/черного</li>
            <li><strong>ЛХ:</strong> +0.25 за 1 черного, +0.5 за 2, +0.8 за 3 (только для первого убитого красного/шерифа)</li>
            <li><strong>Техфолы:</strong> 4 техфола = дисквалификация (красная метка)</li>
            <li><strong>Баллы:</strong> +1 за победу команды, +0 за поражение + Доп+/- + ЛХ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GameTab;
