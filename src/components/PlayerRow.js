import React from 'react';
import { ROLES, TECH_FOULS_LIMIT } from '../utils/constants';

function PlayerRow({ player, onUpdate, disabled }) {
  const handleRoleChange = (e) => {
    onUpdate({ ...player, role: e.target.value });
  };

  const handleFoulsChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    onUpdate({ ...player, fouls: value });
  };

  const handleTechFoulToggle = (index) => {
    const newTechFouls = player.techFouls === index + 1 ? index : index + 1;
    onUpdate({ ...player, techFouls: newTechFouls });
  };

  const handleBonusChange = (e) => {
    const value = e.target.value.replace(',', '.');
    onUpdate({ ...player, bonusPoints: value });
  };

  const handlePenaltyChange = (e) => {
    const value = e.target.value.replace(',', '.');
    onUpdate({ ...player, penaltyPoints: value });
  };

  const handlePUChange = (value) => {
    onUpdate({ ...player, pu: value });
  };

  const handleSSToggle = () => {
    onUpdate({ ...player, ss: !player.ss });
  };

  const handleVSKRToggle = () => {
    onUpdate({ ...player, vskr: !player.vskr });
  };

  const isDisqualified = player.techFouls >= TECH_FOULS_LIMIT;

  return (
    <tr style={{ backgroundColor: isDisqualified ? '#ffe6e6' : 'transparent' }}>
      {/* Номер */}
      <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
        {player.slot}
      </td>

      {/* Игрок */}
      <td>
        <strong>{player.nickname}</strong>
        {isDisqualified && (
          <span style={{ color: 'red', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
            [УДАЛЁН]
          </span>
        )}
      </td>

      {/* Роль */}
      <td>
        <select
          className="form-control"
          value={player.role}
          onChange={handleRoleChange}
          disabled={disabled}
          style={{ fontSize: '0.875rem', padding: '0.25rem' }}
        >
          <option value="">-</option>
          <option value={ROLES.MAFIA}>Мафия</option>
          <option value={ROLES.DON}>Дон</option>
          <option value={ROLES.SHERIFF}>Шериф</option>
          <option value={ROLES.CIVILIAN}>Мирный</option>
        </select>
      </td>

      {/* Фолы */}
      <td>
        <input
          type="number"
          className="form-control"
          value={player.fouls}
          onChange={handleFoulsChange}
          min="0"
          style={{ width: '60px', fontSize: '0.875rem', padding: '0.25rem' }}
        />
      </td>

      {/* Тех фолы */}
      <td>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {[0, 1, 2, 3].map(index => (
            <label key={index} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={player.techFouls > index}
                onChange={() => handleTechFoulToggle(index)}
                style={{ marginRight: '0.25rem' }}
              />
              <span style={{ fontSize: '0.75rem' }}>{index + 1}</span>
            </label>
          ))}
        </div>
      </td>

      {/* Баллы (авто) */}
      <td style={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f0f0' }}>
        {player.points.toFixed(2)}
      </td>

      {/* Доп + */}
      <td>
        <input
          type="text"
          className="form-control"
          value={player.bonusPoints}
          onChange={handleBonusChange}
          placeholder="0"
          style={{ width: '70px', fontSize: '0.875rem', padding: '0.25rem' }}
        />
      </td>

      {/* Доп -- */}
      <td>
        <input
          type="text"
          className="form-control"
          value={player.penaltyPoints}
          onChange={handlePenaltyChange}
          placeholder="0"
          style={{ width: '70px', fontSize: '0.875rem', padding: '0.25rem' }}
        />
      </td>

      {/* ПУ/СС/ВСКР */}
      <td style={{ fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* ПУ */}
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <span style={{ minWidth: '30px' }}>ПУ:</span>
            {[0, 1, 2, 3].map(value => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`pu-${player.slot}`}
                  checked={player.pu === value}
                  onChange={() => handlePUChange(value)}
                  style={{ marginRight: '0.125rem' }}
                />
                <span>{value}</span>
              </label>
            ))}
          </div>

          {/* СС */}
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={player.ss}
              onChange={handleSSToggle}
              style={{ marginRight: '0.25rem' }}
            />
            <span>СС (самострел)</span>
          </label>

          {/* ВСКР */}
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={player.vskr}
              onChange={handleVSKRToggle}
              style={{ marginRight: '0.25rem' }}
            />
            <span>ВСКР (вскрытие)</span>
          </label>
        </div>
      </td>
    </tr>
  );
}

export default PlayerRow;
