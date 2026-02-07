// Тестовые данные для отладки приложения

export const testPlayers = [
  { id: 1, nickname: 'Алекс', games_count: 15, wins_count: 8, total_points: 12.5, bonus_points: 2.5, penalty_points: 0.4 },
  { id: 2, nickname: 'Мария', games_count: 12, wins_count: 7, total_points: 11.0, bonus_points: 1.8, penalty_points: 0.2 },
  { id: 3, nickname: 'Дмитрий', games_count: 20, wins_count: 11, total_points: 18.3, bonus_points: 3.2, penalty_points: 0.9 },
  { id: 4, nickname: 'Екатерина', games_count: 8, wins_count: 4, total_points: 7.5, bonus_points: 1.0, penalty_points: 0.5 },
  { id: 5, nickname: 'Иван', games_count: 18, wins_count: 10, total_points: 16.2, bonus_points: 2.8, penalty_points: 0.6 },
  { id: 6, nickname: 'Ольга', games_count: 10, wins_count: 6, total_points: 9.8, bonus_points: 1.5, penalty_points: 0.2 },
  { id: 7, nickname: 'Сергей', games_count: 14, wins_count: 7, total_points: 11.9, bonus_points: 2.1, penalty_points: 0.7 },
  { id: 8, nickname: 'Наталья', games_count: 9, wins_count: 5, total_points: 8.4, bonus_points: 1.2, penalty_points: 0.3 },
  { id: 9, nickname: 'Павел', games_count: 16, wins_count: 9, total_points: 14.7, bonus_points: 2.6, penalty_points: 0.5 },
  { id: 10, nickname: 'Виктория', games_count: 11, wins_count: 6, total_points: 10.1, bonus_points: 1.7, penalty_points: 0.4 }
];

export const testGameData = {
  gameDate: '2024-02-07',
  tournament: 'Зимний турнир 2024',
  stage: 'Финал',
  tableNumber: '1',
  gameNumber: '5',
  players: [
    { slot: 1, nickname: 'Алекс', role: 'Мирный', fouls: 1, techFouls: 0, bonusPoints: 0, penaltyPoints: 0, points: 1, pu: 0, ss: false, vskr: false },
    { slot: 2, nickname: 'Мария', role: 'Мафия', fouls: 0, techFouls: 0, bonusPoints: 0, penaltyPoints: 0, points: 1, pu: 0, ss: false, vskr: false },
    { slot: 3, nickname: 'Дмитрий', role: 'Шериф', fouls: 2, techFouls: 0, bonusPoints: 0.5, penaltyPoints: 0, points: 0.5, pu: 2, ss: false, vskr: true },
    { slot: 4, nickname: 'Екатерина', role: 'Мирный', fouls: 0, techFouls: 0, bonusPoints: 0, penaltyPoints: 0, points: 1, pu: 0, ss: false, vskr: false },
    { slot: 5, nickname: 'Иван', role: 'Мафия', fouls: 1, techFouls: 0, bonusPoints: 0, penaltyPoints: 0, points: 1, pu: 0, ss: false, vskr: false },
    { slot: 6, nickname: 'Ольга', role: 'Мирный', fouls: 0, techFouls: 0, bonusPoints: 0, penaltyPoints: 0, points: 1, pu: 0, ss: false, vskr: false },
    { slot: 7, nickname: 'Сергей', role: 'Дон', fouls: 1, techFouls: 0, bonusPoints: 0, penaltyPoints: 0, points: 1, pu: 0, ss: false, vskr: false },
    { slot: 8, nickname: 'Наталья', role: 'Мирный', fouls: 0, techFouls: 0, bonusPoints: 0, penaltyPoints: 0, points: 1, pu: 0, ss: false, vskr: false },
    { slot: 9, nickname: 'Павел', role: 'Мирный', fouls: 2, techFouls: 0, bonusPoints: 0, penaltyPoints: 0, points: 1, pu: 0, ss: false, vskr: false },
    { slot: 10, nickname: 'Виктория', role: 'Мирный', fouls: 0, techFouls: 0, bonusPoints: 0, penaltyPoints: 0, points: 1, pu: 0, ss: false, vskr: false }
  ],
  votings: [
    {
      number: 1,
      candidates: [2, 5, 7],
      votes: [3, 4, 2],
      revotes: []
    },
    {
      number: 2,
      candidates: [3, 8],
      votes: [4, 3],
      revotes: []
    },
    {
      number: 3,
      candidates: [2],
      votes: [5],
      revotes: []
    }
  ],
  shootings: [
    { night: 'first', value: '3', playerNumber: 3 },
    { night: 1, value: '4', playerNumber: 4 },
    { night: 2, value: '9', playerNumber: 9 },
    { night: 3, value: '*', playerNumber: null },
    { night: 4, value: '', playerNumber: null },
    { night: 5, value: '', playerNumber: null },
    { night: 6, value: '', playerNumber: null }
  ],
  bestMove: {
    numbers: '2, 5, 7',
    firstKilledSlot: 3
  },
  winnerTeam: 'Мафия',
  opinion: 'Интересная игра. Шериф вышел рано, но успел вскрыть Дона. Мафия отлично играла в команде.'
};

// Функция для добавления тестовых игроков в БД
export const addTestPlayers = async (addPlayerFunc) => {
  for (const player of testPlayers) {
    await addPlayerFunc(player.nickname);
  }
  console.log('Тестовые игроки добавлены');
};

// Функция для создания случайной игры
export const generateRandomGame = (players) => {
  const shuffled = [...players].sort(() => Math.random() - 0.5).slice(0, 10);
  
  const roles = ['Мирный', 'Мирный', 'Мирный', 'Мирный', 'Мирный', 'Мирный', 'Шериф', 'Мафия', 'Мафия', 'Дон'];
  const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
  
  return {
    gameDate: new Date().toISOString().split('T')[0],
    tournament: 'Тестовый турнир',
    stage: 'Тест',
    tableNumber: '1',
    gameNumber: '1',
    players: shuffled.map((player, index) => ({
      slot: index + 1,
      nickname: player.nickname,
      role: shuffledRoles[index],
      fouls: Math.floor(Math.random() * 3),
      techFouls: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      points: Math.random() > 0.5 ? 1 : 0,
      pu: 0,
      ss: false,
      vskr: false
    })),
    votings: Array(3).fill(null).map((_, i) => ({
      number: i + 1,
      candidates: [1, 2, 3].slice(0, Math.floor(Math.random() * 3) + 1),
      votes: [3, 4, 2].slice(0, Math.floor(Math.random() * 3) + 1),
      revotes: []
    })),
    shootings: Array(7).fill(null).map((_, i) => ({
      night: i === 0 ? 'first' : i,
      value: i < 3 ? String(Math.floor(Math.random() * 10) + 1) : '',
      playerNumber: i < 3 ? Math.floor(Math.random() * 10) + 1 : null
    })),
    bestMove: {
      numbers: '2, 5, 7',
      firstKilledSlot: 3
    },
    winnerTeam: Math.random() > 0.5 ? 'Мафия' : 'Мирные',
    opinion: 'Автоматически сгенерированная тестовая игра'
  };
};
