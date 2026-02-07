import { ROLES, BEST_MOVE_BONUS, WIN_BONUS, LOSS_BONUS, TEAM_COLORS } from '../utils/constants';

// Расчет Лучшего Хода (ЛХ)
export const calculateBestMove = (bestMoveNumbers, players, firstKilledSlot) => {
  const result = {
    bonus: 0,
    pu: 0, // Количество угаданных черных (для отметки ПУ)
    applied: false
  };

  // Проверка: первый убитый должен быть красным или шерифом
  const firstKilled = players.find(p => p.slot === firstKilledSlot);
  if (!firstKilled || !firstKilled.role) {
    return result;
  }

  const isRed = firstKilled.role === ROLES.CIVILIAN || firstKilled.role === ROLES.SHERIFF;
  if (!isRed) {
    return result;
  }

  // Парсинг номеров ЛХ (удаление пробелов, разделение по запятой)
  const guessedNumbers = bestMoveNumbers
    .split(',')
    .map(n => parseInt(n.trim()))
    .filter(n => !isNaN(n) && n >= 1 && n <= 10);

  if (guessedNumbers.length === 0) {
    return result;
  }

  // Подсчет совпадений с реальными черными
  const blackPlayers = players.filter(p => 
    p.role === ROLES.MAFIA || p.role === ROLES.DON
  );

  const blackSlots = blackPlayers.map(p => p.slot);
  const correctGuesses = guessedNumbers.filter(n => blackSlots.includes(n)).length;

  // Начисление бонусов по п.8.3
  if (correctGuesses === 1) {
    result.bonus = BEST_MOVE_BONUS.ONE_BLACK;
    result.pu = 1;
  } else if (correctGuesses === 2) {
    result.bonus = BEST_MOVE_BONUS.TWO_BLACKS;
    result.pu = 2;
  } else if (correctGuesses === 3) {
    result.bonus = BEST_MOVE_BONUS.THREE_BLACKS;
    result.pu = 3;
  }

  result.applied = result.bonus > 0;

  return result;
};

// Расчет базовых баллов игрока
export const calculatePlayerPoints = (player, winnerTeam, bestMoveData) => {
  let points = 0;

  // Базовый балл за победу/поражение
  const playerTeam = (player.role === ROLES.MAFIA || player.role === ROLES.DON) ? 'Мафия' : 'Мирные';
  
  if (playerTeam === winnerTeam) {
    points += WIN_BONUS; // +1 за победу
  } else {
    points += LOSS_BONUS; // +0 за поражение
  }

  // Добавление ЛХ бонуса (если игрок - первый убитый и есть бонус)
  if (bestMoveData.applied && player.isFirstKilled) {
    points += bestMoveData.bonus;
  }

  // Добавление дополнительных баллов (Доп +)
  if (player.bonusPoints) {
    points += parseFloat(player.bonusPoints) || 0;
  }

  // Вычитание штрафов (Доп --)
  if (player.penaltyPoints) {
    points -= parseFloat(player.penaltyPoints) || 0;
  }

  return parseFloat(points.toFixed(2));
};

// Автоматическое заполнение ролей (после выбора 3 черных + шериф)
export const autoFillRoles = (players) => {
  const assigned = players.filter(p => p.role && p.role !== '');
  
  const mafiaCount = assigned.filter(p => p.role === ROLES.MAFIA).length;
  const donCount = assigned.filter(p => p.role === ROLES.DON).length;
  const sheriffCount = assigned.filter(p => p.role === ROLES.SHERIFF).length;

  // Проверка: если есть ровно 2 мафии + 1 дон + 1 шериф = 4 роли
  const totalBlacks = mafiaCount + donCount;
  
  if (totalBlacks === 3 && sheriffCount === 1) {
    // Заполнить остальные как Мирные
    return players.map(p => {
      if (!p.role || p.role === '') {
        return { ...p, role: ROLES.CIVILIAN };
      }
      return p;
    });
  }

  return players;
};

// Валидация ролей
export const validateRoles = (players) => {
  const errors = [];
  
  const roles = players.map(p => p.role).filter(r => r);
  
  const mafiaCount = roles.filter(r => r === ROLES.MAFIA).length;
  const donCount = roles.filter(r => r === ROLES.DON).length;
  const sheriffCount = roles.filter(r => r === ROLES.SHERIFF).length;
  const civilianCount = roles.filter(r => r === ROLES.CIVILIAN).length;

  // Проверка состава
  if (mafiaCount !== 2) {
    errors.push(`Должно быть ровно 2 Мафии (сейчас: ${mafiaCount})`);
  }
  if (donCount !== 1) {
    errors.push(`Должен быть ровно 1 Дон (сейчас: ${donCount})`);
  }
  if (sheriffCount !== 1) {
    errors.push(`Должен быть ровно 1 Шериф (сейчас: ${sheriffCount})`);
  }
  if (civilianCount !== 6) {
    errors.push(`Должно быть ровно 6 Мирных (сейчас: ${civilianCount})`);
  }

  // Проверка заполнения всех 10 ролей
  if (roles.length !== 10) {
    errors.push(`Не все роли назначены (назначено: ${roles.length}/10)`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Отслеживание живых игроков (с учетом отстрелов, голосований, дисквалификаций)
export const getAlivePlayers = (players, votings, shootings) => {
  const eliminated = new Set();

  // Добавление дисквалифицированных (4 техфола)
  players.forEach(p => {
    if (p.techFouls >= 4) {
      eliminated.add(p.slot);
    }
  });

  // Добавление убитых ночью
  shootings.forEach(shooting => {
    if (shooting.playerNumber && shooting.playerNumber >= 1 && shooting.playerNumber <= 10) {
      eliminated.add(shooting.playerNumber);
    }
  });

  // Добавление заголосованных
  votings.forEach(voting => {
    if (voting.eliminated && voting.eliminated.length > 0) {
      voting.eliminated.forEach(slot => eliminated.add(slot));
    }
  });

  return players.filter(p => !eliminated.has(p.slot));
};

// Валидация голосов (проверка, что сумма <= количеству живых)
export const validateVoting = (voting, aliveCount) => {
  const totalVotes = voting.votes.reduce((sum, v) => sum + (parseInt(v) || 0), 0);
  
  if (totalVotes > aliveCount) {
    return {
      valid: false,
      error: `Голосов (${totalVotes}) больше, чем живых игроков (${aliveCount})`
    };
  }

  return { valid: true };
};

// Автоматическое определение кандидатов для переголосования
export const findRevoteCandidates = (voting) => {
  if (!voting.votes || voting.votes.length === 0) {
    return [];
  }

  const maxVotes = Math.max(...voting.votes.map(v => parseInt(v) || 0));
  
  if (maxVotes === 0) {
    return [];
  }

  // Кандидаты с максимальным количеством голосов
  const candidates = [];
  voting.votes.forEach((votes, index) => {
    if (parseInt(votes) === maxVotes) {
      candidates.push(voting.candidates[index]);
    }
  });

  // Переголосование только если кандидатов > 1
  return candidates.length > 1 ? candidates : [];
};

// Расчет рейтинга за период
export const calculateRating = (games, startDate, endDate) => {
  const playerStats = {};

  games.forEach(game => {
    const gameDate = new Date(game.game_date);
    if (gameDate >= new Date(startDate) && gameDate <= new Date(endDate)) {
      const protocol = game.protocol_json;
      
      protocol.players.forEach(player => {
        if (!playerStats[player.nickname]) {
          playerStats[player.nickname] = {
            nickname: player.nickname,
            games: 0,
            wins: 0,
            totalPoints: 0,
            bonusPoints: 0,
            penaltyPoints: 0
          };
        }

        const stats = playerStats[player.nickname];
        stats.games += 1;
        
        const playerTeam = (player.role === ROLES.MAFIA || player.role === ROLES.DON) ? 'Мафия' : 'Мирные';
        if (playerTeam === game.winner_team) {
          stats.wins += 1;
        }

        stats.totalPoints += player.points || 0;
        stats.bonusPoints += player.bonusPoints || 0;
        stats.penaltyPoints += player.penaltyPoints || 0;
      });
    }
  });

  // Конвертация в массив и сортировка
  const rating = Object.values(playerStats).map(stats => ({
    ...stats,
    winPercentage: stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(2) : 0
  }));

  // Сортировка: баллы → доп.баллы → победы
  rating.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.bonusPoints !== a.bonusPoints) return b.bonusPoints - a.bonusPoints;
    return b.wins - a.wins;
  });

  // Добавление мест
  rating.forEach((player, index) => {
    player.place = index + 1;
  });

  return rating;
};
