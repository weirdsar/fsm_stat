import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { saveAs } from 'file-saver';
import { calculateRating } from './logic_module';
import { getGames } from './db_module';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Экспорт протокола в PDF
export const exportProtocolToPDF = (gameData, protocolData) => {
  const { players, votings, shootings, bestMove, winnerTeam, opinion } = protocolData;

  // Таблица игроков
  const playersTableBody = [
    [
      { text: '№', style: 'tableHeader' },
      { text: 'Игрок', style: 'tableHeader' },
      { text: 'Роль', style: 'tableHeader' },
      { text: 'Фолы', style: 'tableHeader' },
      { text: 'Т.Ф.', style: 'tableHeader' },
      { text: 'Баллы', style: 'tableHeader' },
      { text: 'Доп+', style: 'tableHeader' },
      { text: 'Доп--', style: 'tableHeader' },
      { text: 'ПУ/СС/ВСКР', style: 'tableHeader' }
    ],
    ...players.map(p => [
      p.slot,
      p.nickname,
      p.role || '-',
      p.fouls || 0,
      p.techFouls >= 4 ? '✗' : p.techFouls || 0,
      p.points.toFixed(2),
      p.bonusPoints || 0,
      p.penaltyPoints || 0,
      `${p.pu}/${p.ss ? '✓' : ''}/${p.vskr ? '✓' : ''}`
    ])
  ];

  // Голосования
  const votingsContent = votings
    .filter(v => v.candidates && v.candidates.length > 0)
    .map(v => ({
      text: [
        { text: `Голосование ${v.number}\n`, bold: true },
        `Кандидаты: ${v.candidates.join(', ')}\n`,
        `Голоса: ${v.votes.join(', ')}\n`,
        v.revotes.length > 0 ? `Переголосования: ${v.revotes.length}\n` : ''
      ],
      margin: [0, 0, 0, 10]
    }));

  // Отстрелы
  const shootingsText = shootings
    .filter(s => s.value)
    .map(s => {
      if (s.night === 'first') {
        return `Первый: ${s.value}`;
      }
      return `Ночь ${s.night}: ${s.value}`;
    })
    .join(' | ');

  // Документ PDF
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 60, 40, 60],
    content: [
      // Заголовок
      {
        text: 'ПРОТОКОЛ ИГРЫ В СПОРТИВНУЮ МАФИЮ',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },

      // Метаданные
      {
        columns: [
          { text: `Турнир: ${gameData.tournament}`, width: '*' },
          { text: `Стадия: ${gameData.stage}`, width: '*' }
        ],
        margin: [0, 0, 0, 5]
      },
      {
        columns: [
          { text: `Дата: ${new Date(gameData.gameDate).toLocaleDateString('ru-RU')}`, width: '*' },
          { text: `Стол №: ${gameData.tableNumber}`, width: 'auto' },
          { text: `Игра №: ${gameData.gameNumber}`, width: 'auto' }
        ],
        margin: [0, 0, 0, 20]
      },

      // Таблица игроков
      {
        table: {
          headerRows: 1,
          widths: [25, '*', 60, 40, 35, 50, 40, 40, 70],
          body: playersTableBody
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },

      // Победитель
      {
        text: `ПОБЕДИВШАЯ КОМАНДА: ${winnerTeam || '-'}`,
        style: 'subheader',
        margin: [0, 0, 0, 10]
      },

      // Лучший ход
      {
        text: [
          { text: 'ЛУЧШИЙ ХОД: ', bold: true },
          bestMove.numbers || '-',
          bestMove.firstKilledSlot ? ` | Игрок № ${bestMove.firstKilledSlot}` : ''
        ],
        margin: [0, 0, 0, 10]
      },

      // Отстрелы
      {
        text: [
          { text: 'СТРЕЛЬБА: ', bold: true },
          shootingsText || '-'
        ],
        margin: [0, 0, 0, 10]
      },

      // Голосования
      {
        text: 'ГОЛОСОВАНИЯ',
        style: 'subheader',
        margin: [0, 10, 0, 10]
      },
      ...votingsContent,

      // Мнение
      opinion ? {
        text: 'МНЕНИЕ / ПРОТОКОЛ',
        style: 'subheader',
        margin: [0, 10, 0, 10]
      } : {},
      opinion ? {
        text: opinion,
        fontSize: 9,
        margin: [0, 0, 0, 10]
      } : {}
    ],

    styles: {
      header: {
        fontSize: 16,
        bold: true
      },
      subheader: {
        fontSize: 12,
        bold: true
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        fillColor: '#eeeeee'
      }
    },

    defaultStyle: {
      fontSize: 10
    }
  };

  // Генерация и скачивание
  const fileName = `protocol-${gameData.gameDate}-table${gameData.tableNumber}-game${gameData.gameNumber}.pdf`;
  
  pdfMake.createPdf(docDefinition).download(fileName);
};

// Экспорт рейтинга в HTML
export const exportRatingToHTML = (startDate, endDate) => {
  const games = getGames(startDate, endDate);
  
  if (games.length === 0) {
    alert('Нет игр за указанный период');
    return;
  }

  const rating = calculateRating(games, startDate, endDate);

  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Рейтинг Мафии - ${startDate} - ${endDate}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .info {
      padding: 1.5rem 2rem;
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }

    .info p {
      margin: 0.25rem 0;
      font-size: 0.95rem;
      color: #495057;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background-color: #f8f9fa;
      position: sticky;
      top: 0;
    }

    th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th.center, td.center {
      text-align: center;
    }

    tbody tr {
      transition: background-color 0.2s ease;
    }

    tbody tr:hover {
      background-color: #f8f9fa;
    }

    tbody tr:nth-child(even) {
      background-color: #fafbfc;
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
      font-size: 0.95rem;
      color: #212529;
    }

    .place {
      font-weight: bold;
      font-size: 1.1rem;
    }

    .place-1 { color: #ffd700; }
    .place-2 { color: #c0c0c0; }
    .place-3 { color: #cd7f32; }

    .nickname {
      font-weight: 600;
      color: #667eea;
    }

    .points {
      font-weight: bold;
      color: #28a745;
    }

    .footer {
      padding: 1.5rem 2rem;
      text-align: center;
      background-color: #f8f9fa;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 0.875rem;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
      }

      .header {
        background: #667eea;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎴 Рейтинг Спортивной Мафии</h1>
      <p>Период: ${new Date(startDate).toLocaleDateString('ru-RU')} - ${new Date(endDate).toLocaleDateString('ru-RU')}</p>
    </div>

    <div class="info">
      <p><strong>Всего игр:</strong> ${games.length}</p>
      <p><strong>Игроков в рейтинге:</strong> ${rating.length}</p>
      <p><strong>Дата формирования:</strong> ${new Date().toLocaleString('ru-RU')}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th class="center">Место</th>
          <th>Игрок</th>
          <th class="center">Игры</th>
          <th class="center">Победы</th>
          <th class="center">% побед</th>
          <th class="center">Баллы</th>
          <th class="center">Доп. баллы</th>
          <th class="center">Штрафы</th>
        </tr>
      </thead>
      <tbody>
        ${rating.map(player => `
          <tr>
            <td class="center place place-${player.place <= 3 ? player.place : ''}">${player.place}</td>
            <td class="nickname">${player.nickname}</td>
            <td class="center">${player.games}</td>
            <td class="center">${player.wins}</td>
            <td class="center">${player.winPercentage}%</td>
            <td class="center points">${player.totalPoints.toFixed(2)}</td>
            <td class="center">${player.bonusPoints.toFixed(2)}</td>
            <td class="center">${player.penaltyPoints.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>Протокол Спортивной Мафии | Создано: ${new Date().toLocaleDateString('ru-RU')}</p>
    </div>
  </div>
</body>
</html>
  `;

  // Сохранение HTML файла
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const fileName = `rating-${startDate}-${endDate}.html`;
  saveAs(blob, fileName);
};
