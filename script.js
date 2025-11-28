let gameMode = null; // 'local' или 'ai'
let aiLevel = null;
let board = null;
let currentPlayer = 'w'; // 'w' — белые, 'b' — чёрные
let selectedCell = null;

// Упрощённая начальная позиция (только пешки и короли для демонстрации)
const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// Простая карта фигур
const pieceToEmoji = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

document.getElementById('localBtn').addEventListener('click', () => {
  gameMode = 'local';
  startGame();
});

document.getElementById('aiBtn').addEventListener('click', () => {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('aiMenu').style.display = 'block';
});

document.querySelectorAll('#aiMenu .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    aiLevel = parseInt(btn.dataset.level);
    gameMode = 'ai';
    startGame();
  });
});

document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('aiMenu').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
});

document.getElementById('restartBtn').addEventListener('click', () => {
  resetGame();
});

function startGame() {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('aiMenu').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  resetGame();
}

function resetGame() {
  board = JSON.parse(JSON.stringify(initialBoard));
  currentPlayer = 'w';
  selectedCell = null;
  renderBoard();
}

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
      cell.dataset.row = row;
      cell.dataset.col = col;

      const piece = board[row][col];
      if (piece) {
        cell.textContent = pieceToEmoji[piece] || piece;
      }

      cell.addEventListener('click', () => handleCellClick(row, col));
      boardEl.appendChild(cell);
    }
  }
}

function handleCellClick(row, col) {
  const clickedPiece = board[row][col];

  // Если выбрана клетка и нажата другая — попытка хода
  if (selectedCell) {
    const [sRow, sCol] = selectedCell;
    if (sRow === row && sCol === col) {
      clearSelection();
      return;
    }

    // Очень упрощённая валидация хода (только для демонстрации)
    if (isValidMove(sRow, sCol, row, col)) {
      board[row][col] = board[sRow][sCol];
      board[sRow][sCol] = null;
      currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
      clearSelection();
      renderBoard();

      // Если ИИ — делаем ход
      if (gameMode === 'ai' && currentPlayer === 'b') {
        setTimeout(makeRandomMove, 500);
      }
    } else {
      clearSelection();
    }
  } else {
    // Выбор фигуры
    if (clickedPiece && isPlayerPiece(clickedPiece)) {
      selectedCell = [row, col];
      renderBoard();
      document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`).classList.add('selected');
    }
  }
}

function isPlayerPiece(piece) {
  if (currentPlayer === 'w') return piece && piece === piece.toUpperCase();
  return piece && piece === piece.toLowerCase();
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
  // Упрощённая проверка: нельзя есть свою фигуру, и фигура должна принадлежать текущему игроку
  const piece = board[fromRow][fromCol];
  const target = board[toRow][toCol];
  if (!piece) return false;
  if (target && isSameColor(piece, target)) return false;
  if (!isPlayerPiece(piece)) return false;
  return true; // В реальной игре здесь нужна полная логика!
}

function isSameColor(a, b) {
  return (a === a.toUpperCase() && b === b.toUpperCase()) ||
         (a === a.toLowerCase() && b === b.toLowerCase());
}

function clearSelection() {
  selectedCell = null;
  document.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
}

// Очень простой ИИ — случайный ход чёрными фигурами
function makeRandomMove() {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c] === board[r][c].toLowerCase()) {
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            if (isValidMove(r, c, tr, tc)) {
              moves.push([r, c, tr, tc]);
            }
          }
        }
      }
    }
  }

  if (moves.length > 0) {
    const [fromR, fromC, toR, toC] = moves[Math.floor(Math.random() * moves.length)];
    board[toR][toC] = board[fromR][fromC];
    board[fromR][fromC] = null;
    currentPlayer = 'w';
    renderBoard();
  }
}
