'use strict';

const { rotateClockwise } = require('./pieces');

const LINE_SCORES = [0, 100, 300, 500, 800];

class Game {
  constructor({ board, pieces, input, renderer, schedule = setTimeout, cancel = clearTimeout, onQuit = null }) {
    this.board = board;
    this.pieces = pieces;
    this.input = input;
    this.renderer = renderer;
    this.schedule = schedule;
    this.cancel = cancel;
    this.onQuit = onQuit;
    this.timer = null;
    this.running = false;
    this.reset();
  }

  reset() {
    this.board.reset();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.activePiece = null;
    this.spawnPiece();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.renderer.hideCursor();
    this.input.start((action) => this.handleAction(action));
    this.renderer.render(this);
    this.queueTick();
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
    this.input.stop();
    this.renderer.showCursor();
  }

  queueTick() {
    if (!this.running || this.gameOver || this.timer !== null) return;
    const delay = Math.max(100, 700 - ((this.level - 1) * 60));
    this.timer = this.schedule(() => {
      this.timer = null;
      this.tick();
      this.queueTick();
    }, delay);
  }

  tick() {
    if (this.gameOver) return;
    if (!this.move(0, 1)) this.lockPiece();
    this.renderer.render(this);
  }

  spawnPiece() {
    const piece = this.pieces.next();
    this.activePiece = {
      ...piece,
      x: Math.floor((this.board.width - piece.matrix[0].length) / 2),
      y: 0
    };
    if (this.board.collides(this.activePiece.matrix, this.activePiece.x, this.activePiece.y)) {
      this.gameOver = true;
    }
  }

  move(dx, dy) {
    if (this.gameOver) return false;
    const x = this.activePiece.x + dx;
    const y = this.activePiece.y + dy;
    if (this.board.collides(this.activePiece.matrix, x, y)) return false;
    this.activePiece.x = x;
    this.activePiece.y = y;
    return true;
  }

  rotate() {
    if (this.gameOver) return false;
    const rotated = rotateClockwise(this.activePiece.matrix);
    for (const offset of [0, -1, 1, -2, 2]) {
      const x = this.activePiece.x + offset;
      if (!this.board.collides(rotated, x, this.activePiece.y)) {
        this.activePiece.matrix = rotated;
        this.activePiece.x = x;
        return true;
      }
    }
    return false;
  }

  hardDrop() {
    if (this.gameOver) return;
    let distance = 0;
    while (this.move(0, 1)) distance += 1;
    this.score += distance * 2;
    this.lockPiece();
  }

  lockPiece() {
    if (this.board.lock(this.activePiece)) {
      this.gameOver = true;
      return;
    }
    const cleared = this.board.clearLines();
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.score += LINE_SCORES[cleared] * this.level;
    this.spawnPiece();
  }

  handleAction(action) {
    if (action === 'quit') {
      this.stop();
      if (this.onQuit) this.onQuit();
      return;
    }
    if (action === 'restart') {
      if (this.gameOver) {
        this.reset();
        this.renderer.render(this);
        this.queueTick();
      }
      return;
    }
    if (this.gameOver) return;

    if (action === 'left') this.move(-1, 0);
    if (action === 'right') this.move(1, 0);
    if (action === 'down' && this.move(0, 1)) this.score += 1;
    if (action === 'rotate') this.rotate();
    if (action === 'drop') this.hardDrop();
    this.renderer.render(this);
  }
}

module.exports = { Game };
