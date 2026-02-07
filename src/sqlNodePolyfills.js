// sqlNodePolyfills.js — отключаем Node-модули для sql.js в браузере

// Буфер и процесс (часто требуются)
window.Buffer = window.Buffer || require('buffer/').Buffer;
window.process = window.process || require('process/browser');

// Полностью отключаем ненужные Node-модули
// sql.js их не использует в браузере — просто обманываем импорт
module.exports = {
  fs: false,
  path: false,
  crypto: false,
  stream: require('stream-browserify')
};