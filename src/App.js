import React, { useState, useEffect } from 'react';
import { initDB } from './modules/db_module';
import SetupTab from './components/SetupTab';
import GameTab from './components/GameTab';
import AdminTab from './components/AdminTab';
import './protocol.css';

function App() {
  const [activeTab, setActiveTab] = useState('setup');
  const [dbReady, setDbReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    // Инициализация БД при загрузке
    const initDatabase = async () => {
      try {
        await initDB();
        setDbReady(true);
        console.log('БД инициализирована');
      } catch (error) {
        console.error('Ошибка инициализации БД:', error);
        alert('Ошибка инициализации базы данных. Проверьте консоль.');
      }
    };

    initDatabase();

    // Регистрация Service Worker для PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker зарегистрирован:', registration);
        })
        .catch(error => {
          console.log('Ошибка регистрации Service Worker:', error);
        });
    }
  }, []);

  const handleStartGame = (setupData) => {
    setGameData(setupData);
    setGameStarted(true);
    setActiveTab('game');
  };

  const handleNewGame = () => {
    setGameStarted(false);
    setGameData(null);
    setActiveTab('setup');
  };

  if (!dbReady) {
    return (
      <div className="loading-screen">
        <h2>Загрузка приложения...</h2>
        <p>Инициализация базы данных</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Протокол Спортивной Мафии</h1>
        <p className="subtitle">Версия 1.0 - Оффлайн</p>
      </header>

      <nav className="app-tabs">
        <button
          className={`tab-button ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => setActiveTab('setup')}
          disabled={gameStarted}
        >
          Настройка
        </button>
        <button
          className={`tab-button ${activeTab === 'game' ? 'active' : ''}`}
          onClick={() => setActiveTab('game')}
          disabled={!gameStarted}
        >
          Игра + Итог
        </button>
        <button
          className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          Админ
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'setup' && (
          <SetupTab onStartGame={handleStartGame} />
        )}
        
        {activeTab === 'game' && gameData && (
          <GameTab 
            gameData={gameData} 
            onNewGame={handleNewGame}
          />
        )}
        
        {activeTab === 'admin' && (
          <AdminTab />
        )}
      </main>

      <footer className="app-footer">
        <p>
          © 2024 Протокол Спортивной Мафии | 
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"> GitHub</a> | 
          <button className="link-button" onClick={() => {
            alert('Протокол Спортивной Мафии v1.0\n\nБраузерное приложение для ведения протокола игры в спортивную мафию (10 игроков).\n\nТехнологии: React, sql.js, Bootstrap, PWA');
          }}>
            О программе
          </button>
        </p>
      </footer>
    </div>
  );
}

export default App;
