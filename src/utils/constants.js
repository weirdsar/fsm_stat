// Константы для игры в мафию

export const ROLES = {
  MAFIA: 'Мафия',
  DON: 'Дон',
  SHERIFF: 'Шериф',
  CIVILIAN: 'Мирный'
};

export const TEAMS = {
  MAFIA: 'Мафия',
  CIVILIANS: 'Мирные'
};

export const MISS_SYMBOLS = ['*', 'х', 'П', 'пр', 'Х', 'x', 'X', '?'];

export const BEST_MOVE_BONUS = {
  ONE_BLACK: 0.25,
  TWO_BLACKS: 0.5,
  THREE_BLACKS: 0.8
};

export const TECH_FOULS_LIMIT = 4;

export const MAX_PLAYERS = 10;
export const MAX_VOTINGS = 6;
export const MAX_NIGHTS = 6;
export const MAX_REVOTES = 2;

export const WIN_BONUS = 1;
export const LOSS_BONUS = 0;

// Цвета команд
export const TEAM_COLORS = {
  BLACK: ['Мафия', 'Дон'],
  RED: ['Шериф', 'Мирный']
};

// Статусы игрока
export const PLAYER_STATUS = {
  ALIVE: 'alive',
  KILLED: 'killed',
  VOTED_OUT: 'voted_out',
  DISQUALIFIED: 'disqualified'
};
