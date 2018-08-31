const express = require('express');

const app = express();

app.use(require('./mapa'));

module.exports = app;