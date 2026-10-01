'use strict';

class Board {
  constructor(width = 10, height = 20) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    this.cells = Array.from({ length: this.height }, () => Array(this.width).fill(null));
  }

  collides(matrix, x, y) {
    for (let row = 0; row < matrix.length; row += 1) {
      for (let column = 0; column < matrix[row].length; column += 1) {
        if (!matrix[row][column]) continue;

        const boardX = x + column;
        const boardY = y + row;
        if (boardX < 0 || boardX >= this.width || boardY >= this.height) return true;
        if (boardY >= 0 && this.cells[boardY][boardX]) return true;
      }
    }
    return false;
  }

  lock(piece) {
    let aboveBoard = false;
    piece.matrix.forEach((row, y) => row.forEach((occupied, x) => {
      if (!occupied) return;
      const boardY = piece.y + y;
      if (boardY < 0) {
        aboveBoard = true;
      } else {
        this.cells[boardY][piece.x + x] = piece.symbol;
      }
    }));
    return aboveBoard;
  }

  clearLines() {
    const remaining = this.cells.filter((row) => row.some((cell) => !cell));
    const cleared = this.height - remaining.length;
    const emptyRows = Array.from({ length: cleared }, () => Array(this.width).fill(null));
    this.cells = emptyRows.concat(remaining);
    return cleared;
  }

  snapshot(activePiece = null) {
    const view = this.cells.map((row) => row.slice());
    if (!activePiece) return view;

    activePiece.matrix.forEach((row, y) => row.forEach((occupied, x) => {
      const boardY = activePiece.y + y;
      if (occupied && boardY >= 0 && boardY < this.height) {
        view[boardY][activePiece.x + x] = activePiece.symbol;
      }
    }));
    return view;
  }
}

module.exports = { Board };
