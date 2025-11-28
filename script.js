let gameMode = null;
let aiLevel = 1;
let game = new Chess();
let selectedSquare = null;
let pendingPromotion = null;

// Правильная маппинг-функция
function getPieceSymbol(pieceObj) {
  if (!pieceObj) return null;
  const letter = pieceObj.type; // 'p', 'k', 'q' и т.д.
  const upper = pieceObj.color === 'w' ? letter.toUpperCase() : letter.toLowerCase();
  const mapping = {
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'
  };
  return mapping[upper] || null;
}

// === Обработчики кнопок ===
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

// === Превращение ===
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

// === Основные функции ===
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
  const statusEl = document.getElementById('status');
  if (game.isCheckmate()) {
    statusEl.textContent = `Мат! ${game.turn() === 'w' ? 'Чёрные' : 'Белые'} победили.`;
  } else if (game.isDraw()) {
    statusEl.textContent = 'Ничья!';
  } else if (game.isCheck()) {
    statusEl.textContent = `${game.turn() === 'w' ? 'Белым' : 'Чёрным'} шах!`;
  } else {
    statusEl.textContent = `Ход ${game.turn() === 'w' ? 'белых' : 'чёрных'}`;
  }
}

function coordToSquare(row, col) {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = 8 - row;
  return file + rank;
}

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  const possibleMoves = selectedSquare ? game.moves({ square: selectedSquare, verbose: true }) : [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = coordToSquare(row, col);
      const cell = document.createElement('div');
      cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
      cell.dataset.square = square;

      const pieceObj = game.get(square);
      const symbol = getPieceSymbol(pieceObj);
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
      boardEl.appendChild(cell);
    }
  }
}

function handleCellClick(square) {
  if (pendingPromotion) return;

  const pieceObj = game.get(square);

  if (selectedSquare) {
    const moves = game.moves({ square: selectedSquare, verbose: true });
    const targetMove = moves.find(m => m.to === square && m.promotion);

    if (targetMove) {
      pendingPromotion = { from: selectedSquare, to: square };
      document.getElementById('promotionModal').style.display = 'flex';
      selectedSquare = null;
      renderBoard();
      return;
    }

    const move = game.move({
      from: selectedSquare,
      to: square
    });

    if (move) {
      if (gameMode === 'local') {
        animateMove(selectedSquare, square);
      }
      selectedSquare = null;
      updateStatus();
      renderBoard();

      if (gameMode === 'ai' && game.turn() === 'b' && !game.game_over()) {
        setTimeout(makeAIMove, 400);
      }
    } else {
      if (pieceObj && pieceObj.color === game.turn()) {
        selectedSquare = square;
        renderBoard();
      } else {
        selectedSquare = null;
        renderBoard();
      }
    }
  } else {
    if (pieceObj && pieceObj.color === game.turn()) {
      selectedSquare = square;
      renderBoard();
    }
  }
}

function animateMove(fromSquare, toSquare) {
  const boardEl = document.getElementById('board');
  const fromCell = boardEl.querySelector(`.cell[data-square="${fromSquare}"]`);
  const toCell = boardEl.querySelector(`.cell[data-square="${toSquare}"]`);

  if (!fromCell || !toCell) return;

  const piece = fromCell.textContent;
  if (!piece) return;

  const pieceEl = document.createElement('div');
  pieceEl.className = 'piece-animate';
  pieceEl.textContent = piece;
  pieceEl.style.left = fromCell.offsetLeft + 'px';
  pieceEl.style.top = fromCell.offsetTop + 'px';
  pieceEl.style.fontSize = getComputedStyle(fromCell).fontSize;
  pieceEl.style.fontWeight = '700';

  document.body.appendChild(pieceEl);

  setTimeout(() => {
    pieceEl.style.transform = `translate(${toCell.offsetLeft - fromCell.offsetLeft}px, ${toCell.offsetTop - fromCell.offsetTop}px)`;
    pieceEl.style.opacity = '0';
  }, 10);

  setTimeout(() => {
    if (pieceEl.parentNode) {
      pieceEl.parentNode.removeChild(pieceEl);
    }
  }, 350);
}

function makeAIMove() {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return;

  const move = moves[Math.floor(Math.random() * moves.length)];

  game.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion ? 'q' : undefined
  });

  selectedSquare = null;
  updateStatus();
  renderBoard();
}
