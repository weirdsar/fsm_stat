// sqlPolyfills.js — отключаем Node-модули для sql.js в браузере

// Буфер и процесс (часто требуются)
window.Buffer = window.Buffer || require('buffer/').Buffer;
window.process = window.process || require('process/browser');

// Полностью отключаем ненужные модули (sql.js их не использует)
window.fs = false;
window.path = false;
window.crypto = window.crypto || { getRandomValues: () => crypto.getRandomValues(new Uint8Array(16)) };

// Для stream (иногда тянется)
window.stream = require('stream-browserify');