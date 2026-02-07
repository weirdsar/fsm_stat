import React, { useState, useEffect } from 'react';
import { getPlayers, addPlayer, updatePlayer, deletePlayer, exportDB, importDB } from '../modules/db_module';
import { validateNickname } from '../modules/validation_module';
import { exportRatingToHTML } from '../modules/export_module';

function AdminTab() {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' или 'edit'
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  
  // Для экспорта рейтинга
  const [ratingStartDate, setRatingStartDate] = useState('');
  const [ratingEndDate, setRatingEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = () => {
    const playersData = getPlayers();
    setPlayers(playersData);
  };

  const handleAddPlayer = () => {
    setModalMode('add');
    setNickname('');
    setSelectedPlayer(null);
    setError('');
    setShowModal(true);
  };

  const handleEditPlayer = (player) => {
    setModalMode('edit');
    setNickname(player.nickname);
    setSelectedPlayer(player);
    setError('');
    setShowModal(true);
  };

  const handleDeletePlayer = async (player) => {
    if (window.confirm(`Удалить игрока "${player.nickname}"?\n\nВнимание: статистика останется в сохраненных играх, но игрок не будет отображаться в рейтинге.`)) {
      const result = await deletePlayer(player.id);
      if (result.success) {
        loadPlayers();
        alert('Игрок удален успешно');
      } else {
        alert(`Ошибка удаления: ${result.error}`);
      }
    }
  };

  const handleSavePlayer = async () => {
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    let result;
    if (modalMode === 'add') {
      result = await addPlayer(validation.nickname);
    } else {
      result = await updatePlayer(selectedPlayer.id, validation.nickname);
    }

    if (result.success) {
      setShowModal(false);
      loadPlayers();
      alert(modalMode === 'add' ? 'Игрок добавлен' : 'Игрок обновлен');
    } else {
      setError(result.error);
    }
  };

  const handleExportDB = () => {
    const data = exportDB();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mafia-db-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('База данных экспортирована');
    } else {
      alert('Ошибка экспорта базы данных');
    }
  };

  const handleExportRating = () => {
    setShowRatingModal(true);
    
    // Установить дату начала периода (текущий месяц)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setRatingStartDate(firstDay.toISOString().split('T')[0]);
  };

  const handleGenerateRating = () => {
    if (!ratingStartDate || !ratingEndDate) {
      alert('Укажите даты периода');
      return;
    }

    if (new Date(ratingStartDate) > new Date(ratingEndDate)) {
      alert('Дата начала должна быть раньше даты окончания');
      return;
    }

    exportRatingToHTML(ratingStartDate, ratingEndDate);
    setShowRatingModal(false);
    alert('Рейтинг экспортирован в HTML файл');
  };

  const handleImportDB = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          
          if (window.confirm('Импорт заменит все текущие данные. Продолжить?')) {
            const result = await importDB(data);
            if (result.success) {
              loadPlayers();
              alert('База данных импортирована успешно');
            } else {
              alert(`Ошибка импорта: ${result.error}`);
            }
          }
        } catch (error) {
          alert('Ошибка чтения файла: ' + error.message);
        }
      }
    };
    input.click();
  };

  const filteredPlayers = players.filter(p =>
    p.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-tab">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <span>Управление игроками</span>
            <div className="d-flex gap-2">
              <button className="btn btn-secondary" onClick={handleExportRating}>
                📊 Экспорт рейтинга
              </button>
              <button className="btn btn-secondary" onClick={handleExportDB}>
                💾 Экспорт БД
              </button>
              <button className="btn btn-secondary" onClick={handleImportDB}>
                📥 Импорт БД
              </button>
              <button className="btn btn-primary" onClick={handleAddPlayer}>
                + Добавить игрока
              </button>
            </div>
          </div>
        </div>

        <div className="form-group">
          <input
            type="text"
            className="form-control"
            placeholder="Поиск по нику..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ник</th>
                <th>Игры</th>
                <th>Победы</th>
                <th>% побед</th>
                <th>Баллы</th>
                <th>Доп. баллы</th>
                <th>Штрафы</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    {searchQuery ? 'Игроки не найдены' : 'Нет игроков. Добавьте первого игрока.'}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map(player => (
                  <tr key={player.id}>
                    <td>{player.id}</td>
                    <td><strong>{player.nickname}</strong></td>
                    <td>{player.games_count}</td>
                    <td>{player.wins_count}</td>
                    <td>{player.win_percentage}%</td>
                    <td>{player.total_points.toFixed(2)}</td>
                    <td>{player.bonus_points.toFixed(2)}</td>
                    <td>{player.penalty_points.toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => handleEditPlayer(player)}
                      >
                        Изменить
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDeletePlayer(player)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <p>
            <strong>Всего игроков:</strong> {players.length}
          </p>
        </div>
      </div>

      {/* Модальное окно добавления/редактирования */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {modalMode === 'add' ? 'Добавить игрока' : 'Редактировать игрока'}
            </div>

            <div className="form-group">
              <label className="form-label">Ник игрока</label>
              <input
                type="text"
                className="form-control"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Введите ник..."
                autoFocus
              />
            </div>

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleSavePlayer}>
                {modalMode === 'add' ? 'Добавить' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно экспорта рейтинга */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              Экспорт рейтинга
            </div>

            <div className="form-group">
              <label className="form-label">Дата начала периода</label>
              <input
                type="date"
                className="form-control"
                value={ratingStartDate}
                onChange={(e) => setRatingStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Дата окончания периода</label>
              <input
                type="date"
                className="form-control"
                value={ratingEndDate}
                onChange={(e) => setRatingEndDate(e.target.value)}
              />
            </div>

            <div className="alert alert-info" style={{ fontSize: '0.875rem' }}>
              Рейтинг будет сгенерирован в HTML файл с таблицей игроков за указанный период.
              Сортировка: баллы → доп.баллы → победы.
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRatingModal(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleGenerateRating}>
                Сгенерировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTab;
