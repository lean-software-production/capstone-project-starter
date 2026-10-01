'use strict';

const MAX_DISPLAY_ROWS = 24;

class TerminalRenderer {
  constructor(output = process.stdout) {
    this.output = output;
  }

  frame({ rows, width, score, lines, level, gameOver }) {
    const border = `+${'-'.repeat(width * 2)}+`;
    const boardRows = rows.map((row) => `|${row.map((cell) => cell ? '[]' : '  ').join('')}|`);
    const status = `Score ${score}  Lines ${lines}  Level ${level}`;
    const message = gameOver
      ? 'GAME OVER - r restart, q quit'
      : 'Arrows/WASD move  W/Up rotate  Space drop  q quit';
    const frame = [border, ...boardRows, border, status, message].join('\n');

    if (frame.split('\n').length > MAX_DISPLAY_ROWS) {
      throw new Error(`Display exceeds ${MAX_DISPLAY_ROWS} rows`);
    }
    return frame;
  }

  render(snapshot) {
    this.output.write(`\x1b[2J\x1b[H${this.frame(snapshot)}`);
  }

  hideCursor() {
    if (this.output.isTTY) this.output.write('\x1b[?25l');
  }

  showCursor() {
    if (this.output.isTTY) this.output.write('\x1b[?25h\n');
  }
}

module.exports = { MAX_DISPLAY_ROWS, TerminalRenderer };
