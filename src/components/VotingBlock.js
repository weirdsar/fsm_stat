import React, { useState } from 'react';
import { validateNumbersList } from '../modules/validation_module';
import { findRevoteCandidates } from '../modules/logic_module';

function VotingBlock({ voting, onUpdate, aliveCount }) {
  const [candidatesInput, setCandidatesInput] = useState(voting.candidates.join(', '));
  const [votesInput, setVotesInput] = useState(voting.votes.join(', '));

  const handleCandidatesChange = (e) => {
    const value = e.target.value;
    setCandidatesInput(value);

    const validation = validateNumbersList(value);
    if (validation.valid) {
      const newVoting = {
        ...voting,
        candidates: validation.numbers,
        votes: Array(validation.numbers.length).fill(0)
      };
      onUpdate(newVoting);
      setVotesInput(newVoting.votes.join(', '));
    }
  };

  const handleVotesChange = (e) => {
    const value = e.target.value;
    setVotesInput(value);

    const votes = value
      .split(',')
      .map(v => parseInt(v.trim()) || 0);

    onUpdate({
      ...voting,
      votes: votes
    });
  };

  const handleAddRevote = () => {
    if (voting.revotes.length >= 2) {
      alert('Максимум 2 уровня переголосования');
      return;
    }

    // Автоматически определить кандидатов для переголосования
    const candidates = findRevoteCandidates(voting);
    
    if (candidates.length === 0) {
      alert('Нет кандидатов для переголосования (нужно равенство голосов)');
      return;
    }

    const newRevote = {
      candidates: candidates,
      votes: Array(candidates.length).fill(0)
    };

    onUpdate({
      ...voting,
      revotes: [...voting.revotes, newRevote]
    });
  };

  const handleRevoteUpdate = (index, field, value) => {
    const newRevotes = [...voting.revotes];
    
    if (field === 'candidates') {
      const validation = validateNumbersList(value);
      if (validation.valid) {
        newRevotes[index] = {
          candidates: validation.numbers,
          votes: Array(validation.numbers.length).fill(0)
        };
      }
    } else if (field === 'votes') {
      const votes = value
        .split(',')
        .map(v => parseInt(v.trim()) || 0);
      newRevotes[index].votes = votes;
    }

    onUpdate({
      ...voting,
      revotes: newRevotes
    });
  };

  const totalVotes = voting.votes.reduce((sum, v) => sum + (parseInt(v) || 0), 0);
  const votesWarning = totalVotes > aliveCount;

  return (
    <div 
      className="voting-block"
      style={{
        border: '2px solid #dee2e6',
        borderRadius: '8px',
        padding: '1rem',
        backgroundColor: 'white',
        marginBottom: '1rem'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
        Голосование {voting.number}
      </div>

      {/* Основное голосование */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
          Выставленные (номера через запятую):
        </label>
        <input
          type="text"
          className="form-control"
          value={candidatesInput}
          onChange={handleCandidatesChange}
          placeholder="1, 3, 5"
          style={{ fontSize: '0.875rem', padding: '0.375rem' }}
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
          Количество голосов (через запятую):
        </label>
        <input
          type="text"
          className="form-control"
          value={votesInput}
          onChange={handleVotesChange}
          placeholder="3, 4, 2"
          style={{ fontSize: '0.875rem', padding: '0.375rem' }}
        />
        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: votesWarning ? '#dc3545' : '#6c757d' }}>
          Сумма: {totalVotes} {votesWarning && `(больше живых: ${aliveCount})`}
        </div>
      </div>

      {/* Переголосования */}
      {voting.revotes.map((revote, index) => (
        <div 
          key={index}
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Переголос {index + 1}:
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
              Кандидаты:
            </label>
            <input
              type="text"
              className="form-control"
              value={revote.candidates.join(', ')}
              onChange={(e) => handleRevoteUpdate(index, 'candidates', e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.25rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
              Голоса:
            </label>
            <input
              type="text"
              className="form-control"
              value={revote.votes.join(', ')}
              onChange={(e) => handleRevoteUpdate(index, 'votes', e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.25rem' }}
            />
          </div>
        </div>
      ))}

      {/* Кнопка добавления переголосования */}
      {voting.revotes.length < 2 && (
        <button
          className="btn btn-secondary"
          onClick={handleAddRevote}
          style={{ marginTop: '0.5rem', fontSize: '0.875rem', padding: '0.375rem 0.75rem', width: '100%' }}
        >
          + Переголос
        </button>
      )}
    </div>
  );
}

export default VotingBlock;
