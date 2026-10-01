'use strict';

const KEY_ACTIONS = Object.freeze({
  '\u001b[D': 'left',
  '\u001b[C': 'right',
  '\u001b[B': 'down',
  '\u001b[A': 'rotate',
  a: 'left',
  d: 'right',
  s: 'down',
  w: 'rotate',
  ' ': 'drop',
  q: 'quit',
  r: 'restart',
  '\u0003': 'quit'
});

class TerminalInput {
  constructor(input = process.stdin) {
    this.input = input;
    this.onAction = null;
    this.handleData = this.handleData.bind(this);
  }

  start(onAction) {
    this.onAction = onAction;
    this.input.setEncoding('utf8');
    this.input.on('data', this.handleData);
    if (this.input.isTTY) {
      this.input.setRawMode(true);
      this.input.resume();
    }
  }

  handleData(data) {
    const directAction = KEY_ACTIONS[data];
    if (directAction) {
      this.onAction(directAction);
      return;
    }
    for (const key of data) {
      const action = KEY_ACTIONS[key.toLowerCase()];
      if (action) this.onAction(action);
    }
  }

  stop() {
    this.input.removeListener('data', this.handleData);
    if (this.input.isTTY) this.input.setRawMode(false);
    this.onAction = null;
  }
}

module.exports = { TerminalInput };
