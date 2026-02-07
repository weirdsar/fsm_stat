import { MAX_PLAYERS, MISS_SYMBOLS } from '../utils/constants';

// Валидация номера игрока (1-10)
export const validatePlayerNumber = (number) => {
  const num = parseInt(number);
  if (isNaN(num) || num < 1 || num > MAX_PLAYERS) {
    return {
      valid: false,
      error: `Номер игрока должен быть от 1 до ${MAX_PLAYERS}`
    };
  }
  return { valid: true };
};

// Валидация отстрела (номер или символ промаха)
export const validateShooting = (value) => {
  if (!value || value.trim() === '') {
    return { valid: true, isMiss: false, playerNumber: null };
  }

  const trimmed = value.trim();

  // Проверка на символ промаха
  if (MISS_SYMBOLS.includes(trimmed)) {
    return { valid: true, isMiss: true, playerNumber: null };
  }

  // Проверка на номер игрока
  const num = parseInt(trimmed);
  if (isNaN(num) || num < 1 || num > MAX_PLAYERS) {
    return {
      valid: false,
      error: `Отстрел: введите номер (1-${MAX_PLAYERS}) или символ промаха (${MISS_SYMBOLS.join(', ')})`
    };
  }

  return { valid: true, isMiss: false, playerNumber: num };
};

// Валидация списка номеров (через запятую, для ЛХ или выставленных)
export const validateNumbersList = (numbersString) => {
  if (!numbersString || numbersString.trim() === '') {
    return { valid: true, numbers: [] };
  }

  const numbers = numbersString
    .split(',')
    .map(n => n.trim())
    .filter(n => n !== '');

  const errors = [];
  const validNumbers = [];

  numbers.forEach(num => {
    const parsed = parseInt(num);
    if (isNaN(parsed) || parsed < 1 || parsed > MAX_PLAYERS) {
      errors.push(`"${num}" - неверный номер (допустимо 1-${MAX_PLAYERS})`);
    } else {
      validNumbers.push(parsed);
    }
  });

  // Проверка на дубликаты
  const duplicates = validNumbers.filter((num, index) => validNumbers.indexOf(num) !== index);
  if (duplicates.length > 0) {
    errors.push(`Дубликаты номеров: ${[...new Set(duplicates)].join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    numbers: validNumbers,
    errors
  };
};

// Валидация технических фолов (0-4)
export const validateTechFouls = (count) => {
  const num = parseInt(count);
  if (isNaN(num) || num < 0 || num > 4) {
    return {
      valid: false,
      error: 'Количество техфолов должно быть от 0 до 4'
    };
  }
  return { valid: true, isDisqualified: num === 4 };
};

// Валидация дополнительных баллов (число с точкой/запятой)
export const validateBonusPoints = (value) => {
  if (!value || value.trim() === '') {
    return { valid: true, points: 0 };
  }

  const normalized = value.trim().replace(',', '.');
  const num = parseFloat(normalized);

  if (isNaN(num)) {
    return {
      valid: false,
      error: 'Неверный формат числа (используйте точку или запятую)'
    };
  }

  return { valid: true, points: num };
};

// Валидация даты
export const validateDate = (dateString) => {
  if (!dateString) {
    return {
      valid: false,
      error: 'Дата не указана'
    };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: 'Неверный формат даты'
    };
  }

  return { valid: true, date };
};

// Валидация ника игрока
export const validateNickname = (nickname) => {
  if (!nickname || nickname.trim() === '') {
    return {
      valid: false,
      error: 'Ник не может быть пустым'
    };
  }

  if (nickname.trim().length < 2) {
    return {
      valid: false,
      error: 'Ник должен содержать минимум 2 символа'
    };
  }

  if (nickname.trim().length > 50) {
    return {
      valid: false,
      error: 'Ник не может быть длиннее 50 символов'
    };
  }

  return { valid: true, nickname: nickname.trim() };
};

// Валидация уникальности слотов (нет дубликатов игроков)
export const validateUniqueSlots = (players) => {
  const nicknames = players.map(p => p.nickname).filter(n => n);
  const duplicates = nicknames.filter((name, index) => nicknames.indexOf(name) !== index);

  if (duplicates.length > 0) {
    return {
      valid: false,
      error: `Дубликаты игроков: ${[...new Set(duplicates)].join(', ')}`
    };
  }

  return { valid: true };
};

// Комплексная валидация всего протокола перед сохранением
export const validateProtocol = (gameData) => {
  const errors = [];

  // Проверка даты
  const dateValidation = validateDate(gameData.gameDate);
  if (!dateValidation.valid) {
    errors.push(dateValidation.error);
  }

  // Проверка заполнения игроков (должно быть 10)
  const filledSlots = gameData.players.filter(p => p.nickname).length;
  if (filledSlots !== MAX_PLAYERS) {
    errors.push(`Не все слоты заполнены (заполнено: ${filledSlots}/${MAX_PLAYERS})`);
  }

  // Проверка уникальности игроков
  const uniqueValidation = validateUniqueSlots(gameData.players);
  if (!uniqueValidation.valid) {
    errors.push(uniqueValidation.error);
  }

  // Проверка ролей
  const assignedRoles = gameData.players.filter(p => p.role).length;
  if (assignedRoles !== MAX_PLAYERS) {
    errors.push(`Не все роли назначены (назначено: ${assignedRoles}/${MAX_PLAYERS})`);
  }

  // Проверка победителя
  if (!gameData.winnerTeam) {
    errors.push('Не указана победившая команда');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Предупреждения (не блокируют сохранение, но выводятся пользователю)
export const generateWarnings = (gameData, alivePlayers) => {
  const warnings = [];

  // Проверка: есть ли незаполненные голосования
  const emptyVotings = gameData.votings.filter(v => 
    !v.candidates || v.candidates.length === 0
  ).length;
  
  if (emptyVotings > 0) {
    warnings.push(`${emptyVotings} голосований не заполнено`);
  }

  // Проверка: есть ли незаполненные отстрелы (для завершенной игры)
  const emptyShootings = gameData.shootings.filter(s => !s.value || s.value.trim() === '').length;
  if (emptyShootings > 0 && alivePlayers.length < 5) {
    warnings.push(`${emptyShootings} ночных отстрелов не заполнено (игра близка к завершению)`);
  }

  return warnings;
};
