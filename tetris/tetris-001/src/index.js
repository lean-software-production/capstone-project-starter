'use strict';

const { TetrisGame } = require('./game');
const { renderGame } = require('./renderer');

const game = new TetrisGame();
process.stdout.write(`${renderGame(game)}\n`);
