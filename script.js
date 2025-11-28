let gameMode = null;
let aiLevel = 1;
let game = new Chess();
let selectedSquare = null;
let pendingPromotion = null;

// Надёжная таблица: Unicode шахматные символы
const PIECE_SYMBOLS = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

function getPieceSymbol(pieceObj) {
  if (!pieceObj) return null;
  const key = pieceObj.color + pieceObj.type.toUpperCase();
  return PIECE_SYMBOLS[key] || null;
}

// === Обработчики ===
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

document.querySelectorAll('.promo-piece').forEach(el => {
  el.addEventListener('click', () => {
    const piece = el.dataset.piece;
    if (pendingPromotion) {
      game.move({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: piece
      });
      pendingPromotion = null;
      document.getElementById('promotionModal').style.display = 'none';
      selectedSquare = null;
      updateStatus();
      renderBoard();

      if (gameMode === 'ai' && game.turn() === 'b' && !game.game_over()) {
        setTimeout(makeAIMove, 400);
      }
    }
  });
});

function startGame() {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('aiMenu').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  resetGame();
}

function resetGame() {
  game = new Chess();
  selectedSquare = null;
  pendingPromotion = null;
  document.getElementById('promotionModal').style.display = 'none';
  updateStatus();
  renderBoard();
}

function updateStatus() {
  const el = document.getElementById('status');
  if (game.isCheckmate()) {
    el.textContent = `Мат! ${game.turn() === 'w' ? 'Чёрные' : 'Белые'} победили.`;
  } else if (game.isDraw()) {
    el.textContent = 'Ничья!';
  } else if (game.isCheck()) {
    el.textContent = `${game.turn() === 'w' ? 'Белым' : 'Чёрным'} шах!`;
  } else {
    el.textContent = `Ход ${game.turn() === 'w' ? 'белых' : 'чёрных'}`;
  }
}

function coordToSquare(row, col) {
  return String.fromCharCode(97 + col) + (8 - row);
}

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  const possibleMoves = selectedSquare ? game.moves({ square: selectedSquare, verbose: true }) : [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = coordToSquare(row, col);
      const cell = document.createElement('div');
      cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
      cell.dataset.square = square;

      const piece = game.get(square);
      const symbol = getPieceSymbol(piece);
      if (symbol) {
        cell.textContent = symbol;
      }

      if (selectedSquare === square) {
        cell.classList.add('selected');
      }

      if (possibleMoves.some(m => m.to === square)) {
        cell.classList.add('valid-move');
      }

      cell.addEventListener('click', () => handleCellClick(square));
      board.appendChild(cell);
    }
  }
}

function handleCellClick(square) {
  if (pendingPromotion) return;

  const piece = game.get(square);

  if (selectedSquare) {
    const moves = game.moves({ square: selectedSquare, verbose: true });
    const promoMove = moves.find(m => m.to === square && m.promotion);

    if (promoMove) {
      pendingPromotion = { from: selectedSquare, to: square };
      document.getElementById('promotionModal').style.display = 'flex';
      selectedSquare = null;
      renderBoard();
      return;
    }

    const move = game.move({ from: selectedSquare, to: square });

    if (move) {
      if (gameMode === 'local') animateMove(selectedSquare, square);
      selectedSquare = null;
      updateStatus();
      renderBoard();

      if (gameMode === 'ai' && game.turn() === 'b' && !game.game_over()) {
        setTimeout(makeAIMove, 400);
      }
    } else {
      if (piece && piece.color === game.turn()) {
        selectedSquare = square;
        renderBoard();
      } else {
        selectedSquare = null;
        renderBoard();
      }
    }
  } else {
    if (piece && piece.color === game.turn()) {
      selectedSquare = square;
      renderBoard();
    }
  }
}

function animateMove(from, to) {
  const board = document.getElementById('board');
  const fromCell = board.querySelector(`.cell[data-square="${from}"]`);
  const toCell = board.querySelector(`.cell[data-square="${to}"]`);

  if (!fromCell || !toCell || !fromCell.textContent) return;

  const clone = document.createElement('div');
  clone.textContent = fromCell.textContent;
  clone.className = 'piece-animate';
  clone.style.left = fromCell.offsetLeft + 'px';
  clone.style.top = fromCell.offsetTop + 'px';
  document.body.appendChild(clone);

  setTimeout(() => {
    clone.style.transform = `translate(${toCell.offsetLeft - fromCell.offsetLeft}px, ${toCell.offsetTop - fromCell.offsetTop}px)`;
    clone.style.opacity = '0';
  }, 10);

  setTimeout(() => {
    if (clone.parentNode) clone.parentNode.removeChild(clone);
  }, 350);
}

function makeAIMove() {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return;
  const move = moves[Math.floor(Math.random() * moves.length)];
  game.move({ from: move.from, to: move.to, promotion: move.promotion ? 'q' : undefined });
  selectedSquare = null;
  updateStatus();
  renderBoard();
}
