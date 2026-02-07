import initSqlJs from 'sql.js';

let db = null;

// Инициализация базы данных
export const initDB = async () => {
  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    // Попытка загрузить существующую БД из IndexedDB
    const savedDB = await loadDBFromIndexedDB();
    
    if (savedDB) {
      db = new SQL.Database(savedDB);
      console.log('База данных загружена из IndexedDB');
    } else {
      db = new SQL.Database();
      console.log('Создана новая база данных');
      await createTables();
    }

    return db;
  } catch (error) {
    console.error('Ошибка инициализации БД:', error);
    throw error;
  }
};

// Создание таблиц
const createTables = async () => {
  try {
    // Таблица игроков
    db.run(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT UNIQUE NOT NULL,
        games_count INTEGER DEFAULT 0,
        wins_count INTEGER DEFAULT 0,
        total_points REAL DEFAULT 0,
        bonus_points REAL DEFAULT 0,
        penalty_points REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица игр
    db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_date DATE NOT NULL,
        tournament TEXT,
        stage TEXT,
        table_number TEXT,
        game_number TEXT,
        winner_team TEXT,
        protocol_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Таблицы созданы успешно');
    await saveDBToIndexedDB();
  } catch (error) {
    console.error('Ошибка создания таблиц:', error);
    throw error;
  }
};

// Сохранение БД в IndexedDB
export const saveDBToIndexedDB = async () => {
  try {
    const data = db.export();
    const buffer = data.buffer;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MafiaProtocolDB', 1);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['database'], 'readwrite');
        const store = transaction.objectStore('database');
        store.put(buffer, 'sqliteDB');
        
        transaction.oncomplete = () => {
          console.log('БД сохранена в IndexedDB');
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('database')) {
          db.createObjectStore('database');
        }
      };
    });
  } catch (error) {
    console.error('Ошибка сохранения БД:', error);
  }
};

// Загрузка БД из IndexedDB
const loadDBFromIndexedDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MafiaProtocolDB', 1);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['database'], 'readonly');
      const store = transaction.objectStore('database');
      const getRequest = store.get('sqliteDB');

      getRequest.onsuccess = () => {
        resolve(getRequest.result ? new Uint8Array(getRequest.result) : null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('database')) {
        db.createObjectStore('database');
      }
    };
  });
};

// === CRUD операции для игроков ===

export const addPlayer = async (nickname) => {
  try {
    db.run('INSERT INTO players (nickname) VALUES (?)', [nickname]);
    await saveDBToIndexedDB();
    return { success: true };
  } catch (error) {
    console.error('Ошибка добавления игрока:', error);
    return { success: false, error: error.message };
  }
};

export const getPlayers = () => {
  try {
    const result = db.exec('SELECT * FROM players ORDER BY nickname');
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    const values = result[0].values;
    
    return values.map(row => {
      const player = {};
      columns.forEach((col, idx) => {
        player[col] = row[idx];
      });
      // Вычисление % побед
      player.win_percentage = player.games_count > 0 
        ? ((player.wins_count / player.games_count) * 100).toFixed(2) 
        : 0;
      return player;
    });
  } catch (error) {
    console.error('Ошибка получения игроков:', error);
    return [];
  }
};

export const updatePlayer = async (id, nickname) => {
  try {
    db.run('UPDATE players SET nickname = ? WHERE id = ?', [nickname, id]);
    await saveDBToIndexedDB();
    return { success: true };
  } catch (error) {
    console.error('Ошибка обновления игрока:', error);
    return { success: false, error: error.message };
  }
};

export const deletePlayer = async (id) => {
  try {
    db.run('DELETE FROM players WHERE id = ?', [id]);
    await saveDBToIndexedDB();
    return { success: true };
  } catch (error) {
    console.error('Ошибка удаления игрока:', error);
    return { success: false, error: error.message };
  }
};

// Обновление статистики игрока после игры
export const updatePlayerStats = async (nickname, won, points, bonusPoints, penaltyPoints) => {
  try {
    const query = `
      UPDATE players 
      SET 
        games_count = games_count + 1,
        wins_count = wins_count + ?,
        total_points = total_points + ?,
        bonus_points = bonus_points + ?,
        penalty_points = penalty_points + ?
      WHERE nickname = ?
    `;
    
    db.run(query, [won ? 1 : 0, points, bonusPoints, penaltyPoints, nickname]);
    await saveDBToIndexedDB();
    return { success: true };
  } catch (error) {
    console.error('Ошибка обновления статистики игрока:', error);
    return { success: false, error: error.message };
  }
};

// === CRUD операции для игр ===

export const saveGame = async (gameData) => {
  try {
    const { gameDate, tournament, stage, tableNumber, gameNumber, winnerTeam, protocolJson } = gameData;
    
    db.run(`
      INSERT INTO games (game_date, tournament, stage, table_number, game_number, winner_team, protocol_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [gameDate, tournament, stage, tableNumber, gameNumber, winnerTeam, JSON.stringify(protocolJson)]);
    
    await saveDBToIndexedDB();
    return { success: true };
  } catch (error) {
    console.error('Ошибка сохранения игры:', error);
    return { success: false, error: error.message };
  }
};

export const getGames = (startDate = null, endDate = null) => {
  try {
    let query = 'SELECT * FROM games';
    const params = [];
    
    if (startDate && endDate) {
      query += ' WHERE game_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY game_date DESC, created_at DESC';
    
    const result = db.exec(query, params);
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    const values = result[0].values;
    
    return values.map(row => {
      const game = {};
      columns.forEach((col, idx) => {
        if (col === 'protocol_json') {
          game[col] = JSON.parse(row[idx]);
        } else {
          game[col] = row[idx];
        }
      });
      return game;
    });
  } catch (error) {
    console.error('Ошибка получения игр:', error);
    return [];
  }
};

// Экспорт БД в JSON
export const exportDB = () => {
  try {
    const players = getPlayers();
    const games = getGames();
    
    return {
      players,
      games,
      exportDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Ошибка экспорта БД:', error);
    return null;
  }
};

// Импорт БД из JSON
export const importDB = async (data) => {
  try {
    // Очистка существующих данных
    db.run('DELETE FROM players');
    db.run('DELETE FROM games');
    
    // Импорт игроков
    for (const player of data.players) {
      db.run(`
        INSERT INTO players (nickname, games_count, wins_count, total_points, bonus_points, penalty_points)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [player.nickname, player.games_count, player.wins_count, player.total_points, player.bonus_points, player.penalty_points]);
    }
    
    // Импорт игр
    for (const game of data.games) {
      db.run(`
        INSERT INTO games (game_date, tournament, stage, table_number, game_number, winner_team, protocol_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [game.game_date, game.tournament, game.stage, game.table_number, game.game_number, game.winner_team, JSON.stringify(game.protocol_json)]);
    }
    
    await saveDBToIndexedDB();
    return { success: true };
  } catch (error) {
    console.error('Ошибка импорта БД:', error);
    return { success: false, error: error.message };
  }
};

export const getDB = () => db;
