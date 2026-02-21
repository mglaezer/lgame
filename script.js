const BOARD_SIZE = 4;

const SYMMETRIES = [
  (c, r) => [c, r],
  (c, r) => [3 - r, c],
  (c, r) => [3 - c, 3 - r],
  (c, r) => [r, 3 - c],
  (c, r) => [3 - c, r],
  (c, r) => [c, 3 - r],
  (c, r) => [r, c],
  (c, r) => [3 - r, 3 - c],
];

function sortCells(cells) {
  return cells.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function positionKey(active, opponent, neutrals) {
  return active.map(p => p.join(",")).join(";") + "|" +
    opponent.map(p => p.join(",")).join(";") + "|" +
    neutrals.map(p => p.join(",")).join(";");
}

function canonicalize(active, opponent, neutrals) {
  let bestKey = null;
  for (const sym of SYMMETRIES) {
    const ta = sortCells(active.map(p => sym(p[0], p[1])));
    const to = sortCells(opponent.map(p => sym(p[0], p[1])));
    const tn = sortCells(neutrals.map(p => sym(p[0], p[1])));
    const key = positionKey(ta, to, tn);
    if (bestKey === null || key < bestKey) bestKey = key;
  }
  return bestKey;
}

// depth: half-moves until loss (0 = immediate, 2 = 1 turn, 4 = 2 turns, etc.)
const LOSING_POSITIONS = new Map([
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[1,3],[2,1]], neutrals: [[2,0],[3,1]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[1,3],[2,1]], neutrals: [[2,0],[3,2]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[1,3],[2,0]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,2],[1,3],[2,2],[3,2]], neutrals: [[1,1],[2,0]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,2],[3,2]], neutrals: [[0,3],[2,0]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,2],[3,2]], neutrals: [[1,3],[2,0]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[2,0],[2,1],[2,2],[3,2]], neutrals: [[0,3],[1,2]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,2],[2,0],[2,1],[2,2]], neutrals: [[0,3],[3,2]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,2],[2,0],[2,1],[2,2]], neutrals: [[0,3],[2,3]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,2],[2,0],[2,1],[2,2]], neutrals: [[0,3],[3,3]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[1,3],[2,3]], neutrals: [[2,0],[3,1]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[1,3],[2,3]], neutrals: [[2,0],[3,2]], depth: 0 },
  { active: [[0,0],[0,1],[1,1],[2,1]], opponent: [[0,2],[1,2],[2,2],[2,3]], neutrals: [[2,0],[3,1]], depth: 0 },
  { active: [[0,0],[0,1],[1,1],[2,1]], opponent: [[1,2],[2,2],[3,1],[3,2]], neutrals: [[0,2],[2,0]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,2]], opponent: [[1,0],[1,1],[2,1],[3,1]], neutrals: [[1,3],[2,2]], depth: 0 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[0,3],[2,0]], depth: 2 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[1,3],[2,3]], depth: 2 },
  { active: [[0,0],[0,1],[1,1],[2,1]], opponent: [[0,2],[0,3],[1,2],[2,2]], neutrals: [[2,0],[3,1]], depth: 2 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[1,3],[3,0]], depth: 4 },
  { active: [[0,0],[0,1],[0,2],[1,2]], opponent: [[1,1],[2,1],[2,2],[2,3]], neutrals: [[1,0],[1,3]], depth: 4 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[1,3],[3,2]], depth: 4 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[0,3],[1,3]], depth: 6 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[0,3],[2,3]], depth: 6 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,2],[2,0],[2,1],[2,2]], neutrals: [[0,3],[1,3]], depth: 6 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[0,3],[3,0]], depth: 6 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[0,3],[3,2]], depth: 6 },
  { active: [[0,0],[0,1],[0,2],[1,0]], opponent: [[1,1],[1,2],[2,1],[3,1]], neutrals: [[2,3],[3,2]], depth: 8 },
  { active: [[0,0],[0,1],[0,2],[1,2]], opponent: [[1,3],[2,1],[2,2],[2,3]], neutrals: [[1,1],[3,1]], depth: 8 },
  { active: [[0,0],[0,1],[0,2],[1,2]], opponent: [[1,3],[2,1],[2,2],[2,3]], neutrals: [[1,1],[3,0]], depth: 8 },
].map(p => [positionKey(p.active, p.opponent, sortCells(p.neutrals)), p.depth]));

function allLPlacements() {
  const placements = [];
  const seen = new Set();
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let c = 0; c < BOARD_SIZE; c++) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (const [dc, dr] of dirs) {
        const c1 = c + dc, r1 = r + dr;
        const c2 = c + 2 * dc, r2 = r + 2 * dr;
        if (c2 < 0 || c2 >= BOARD_SIZE || r2 < 0 || r2 >= BOARD_SIZE) continue;
        const perpDirs = dc === 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
        for (const [pc, pr] of perpDirs) {
          const fc = c + pc, fr = r + pr;
          if (fc < 0 || fc >= BOARD_SIZE || fr < 0 || fr >= BOARD_SIZE) continue;
          const cells = sortCells([[c, r], [c1, r1], [c2, r2], [fc, fr]]);
          const key = cells.map(p => p.join(",")).join(";");
          if (!seen.has(key)) {
            seen.add(key);
            placements.push(cells);
          }
        }
      }
    }
  }
  return placements;
}

const ALL_L_PLACEMENTS = allLPlacements();

function isIsomorphic(activeA, opponentA, neutralsA, activeB, opponentB, neutralsB) {
  return canonicalize(activeA, opponentA, neutralsA) ===
    canonicalize(activeB, opponentB, neutralsB);
}

function generateMoves(active, opponent, neutrals) {
  const currentKey = active.map(p => p.join(",")).join(";");
  const blocked = new Set([...opponent, ...neutrals].map(p => p[0] * 4 + p[1]));
  const moves = [];

  for (const pl of ALL_L_PLACEMENTS) {
    if (pl.map(p => p.join(",")).join(";") === currentKey) continue;
    if (pl.some(p => blocked.has(p[0] * 4 + p[1]))) continue;

    moves.push({ active: pl, opponent, neutrals });

    const occupied = new Set([...pl, ...opponent].map(p => p[0] * 4 + p[1]));
    for (let ni = 0; ni < 2; ni++) {
      const otherNeutral = neutrals[1 - ni];
      for (let c = 0; c < BOARD_SIZE; c++) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (occupied.has(c * 4 + r)) continue;
          if (otherNeutral[0] === c && otherNeutral[1] === r) continue;
          if (neutrals[ni][0] === c && neutrals[ni][1] === r) continue;
          const newNeutrals = sortCells([[c, r], otherNeutral]);
          moves.push({ active: pl, opponent, neutrals: newNeutrals });
        }
      }
    }
  }
  return moves;
}

function isLosingPosition(active, opponent, neutrals) {
  const key = canonicalize(active, opponent, neutrals);
  if (LOSING_POSITIONS.has(key)) {
    const depth = LOSING_POSITIONS.get(key);
    return { losing: true, movesLeft: depth / 2 };
  }
  return null;
}

// --- Game UI (browser only) ---

if (typeof document !== "undefined") {
  const CELL = 100;
  const svg = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const undoBtn = document.getElementById("undo-btn");
  const doneBtn = document.getElementById("done-btn");
  const newGameBtn = document.getElementById("new-game-btn");
  const humanScoreEl = document.getElementById("human-score");
  const botScoreEl = document.getElementById("bot-score");

  const INITIAL_HUMAN_L = sortCells([[1,0],[1,1],[1,2],[2,0]]);
  const INITIAL_BOT_L = sortCells([[2,1],[2,2],[2,3],[3,3]]);
  const INITIAL_NEUTRALS = sortCells([[3,0],[0,3]]);

  let game = {};
  let score = { human: 0, bot: 0 };

  function newGame() {
    const humanFirst = Math.random() < 0.5;
    game = {
      humanL: INITIAL_HUMAN_L,
      botL: INITIAL_BOT_L,
      neutrals: INITIAL_NEUTRALS,
      currentPlayer: humanFirst ? "human" : "bot",
      phase: humanFirst ? "placeL" : "botTurn",
      selectedCells: [],
      pendingL: null,
      selectedNeutralIndex: null,
      pendingNeutrals: null,
      savedHumanL: null,
    };
    undoBtn.disabled = true;
    doneBtn.disabled = true;
    render();
    updateStatus();
    if (!humanFirst) {
      setTimeout(botMove, 500);
    }
  }

  function cellKey(c, r) { return c * 4 + r; }

  function isValidLPlacement(cells, opponent, neutrals) {
    if (cells.length !== 4) return false;
    const sorted = sortCells(cells);
    const key = sorted.map(p => p.join(",")).join(";");
    const blocked = new Set([...opponent, ...neutrals].map(p => p[0] * 4 + p[1]));
    return ALL_L_PLACEMENTS.some(pl => {
      if (pl.map(p => p.join(",")).join(";") !== key) return false;
      return !pl.some(p => blocked.has(p[0] * 4 + p[1]));
    });
  }

  function cellsEqual(a, b) {
    if (a.length !== b.length) return false;
    const sa = sortCells(a);
    const sb = sortCells(b);
    return sa.every((p, i) => p[0] === sb[i][0] && p[1] === sb[i][1]);
  }

  // --- Rendering ---

  function render() {
    svg.innerHTML = "";

    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", c * CELL);
        rect.setAttribute("y", r * CELL);
        rect.setAttribute("width", CELL);
        rect.setAttribute("height", CELL);
        rect.setAttribute("fill", "#fff");
        rect.setAttribute("stroke", "#ccc");
        rect.setAttribute("stroke-width", "1");
        svg.appendChild(rect);
      }
    }

    const isDragging = game.phase === "placeL" && !game.pendingL && game.selectedCells.length > 0;
    const showHumanL = game.pendingL || !isDragging;
    const humanLCells = game.pendingL || game.humanL;
    const humanLFaded = game.phase === "placeL" && !game.pendingL;
    if (showHumanL) {
      for (const [c, r] of humanLCells) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", c * CELL + 2);
        rect.setAttribute("y", r * CELL + 2);
        rect.setAttribute("width", CELL - 4);
        rect.setAttribute("height", CELL - 4);
        rect.setAttribute("fill", humanLFaded ? "rgba(231, 76, 60, 0.5)" : "#e74c3c");
        rect.setAttribute("rx", "4");
        svg.appendChild(rect);
      }
    }

    for (const [c, r] of game.botL) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", c * CELL + 2);
      rect.setAttribute("y", r * CELL + 2);
      rect.setAttribute("width", CELL - 4);
      rect.setAttribute("height", CELL - 4);
      rect.setAttribute("fill", "#3498db");
      rect.setAttribute("rx", "4");
      svg.appendChild(rect);
    }

    if (game.phase === "placeL" && !game.pendingL) {
      for (const [c, r] of game.selectedCells) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", c * CELL + 2);
        rect.setAttribute("y", r * CELL + 2);
        rect.setAttribute("width", CELL - 4);
        rect.setAttribute("height", CELL - 4);
        rect.setAttribute("fill", "rgba(231, 76, 60, 0.4)");
        rect.setAttribute("rx", "4");
        svg.appendChild(rect);
      }
    }

    const currentNeutrals = game.pendingNeutrals || game.neutrals;
    for (let i = 0; i < currentNeutrals.length; i++) {
      const [c, r] = currentNeutrals[i];
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", c * CELL + CELL / 2);
      circle.setAttribute("cy", r * CELL + CELL / 2);
      circle.setAttribute("r", CELL / 3);
      circle.setAttribute("fill", "#333");
      if (game.phase === "moveNeutral" && game.selectedNeutralIndex === i) {
        circle.setAttribute("stroke", "#f1c40f");
        circle.setAttribute("stroke-width", "4");
      }
      svg.appendChild(circle);
    }
  }

  function setStatus(text, cls) {
    statusEl.textContent = text;
    statusEl.className = cls || "";
  }

  function updateStatus() {
    if (game.phase === "gameOver") return;
    if (game.currentPlayer === "bot") {
      setStatus("Bot is thinking\u2026", "bot-turn");
    } else if (game.phase === "placeL") {
      setStatus("Drag to place your L-piece", "human-turn");
    } else if (game.phase === "moveNeutral") {
      if (game.selectedNeutralIndex !== null) {
        setStatus("Click an empty cell, or click Done", "human-turn");
      } else {
        setStatus("Move a neutral piece, or click Done", "human-turn");
      }
    }
  }

  // --- Input handling ---

  let dragging = false;

  function getCellFromEvent(e) {
    const rect = svg.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 400 / rect.height;
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    if (c < 0 || c >= BOARD_SIZE || r < 0 || r >= BOARD_SIZE) return null;
    return [c, r];
  }

  function isBlocked(c, r) {
    const neutrals = game.pendingNeutrals || game.neutrals;
    return game.botL.some(p => p[0] === c && p[1] === r) ||
      neutrals.some(p => p[0] === c && p[1] === r);
  }

  function addSelectedCell(c, r) {
    if (game.selectedCells.some(p => p[0] === c && p[1] === r)) return;
    if (isBlocked(c, r)) return;
    if (game.selectedCells.length >= 4) return;
    game.selectedCells.push([c, r]);
    render();
  }

  function onPointerDown(e) {
    if (game.currentPlayer !== "human") return;
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (!cell) return;

    if (game.phase === "placeL" && !game.pendingL) {
      dragging = true;
      game.selectedCells = [];
      addSelectedCell(cell[0], cell[1]);
    } else if (game.phase === "moveNeutral") {
      handleNeutralClick(cell[0], cell[1]);
    }
  }

  function onPointerMove(e) {
    if (!dragging) return;
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (!cell) return;
    addSelectedCell(cell[0], cell[1]);
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    e.preventDefault();

    if (game.selectedCells.length === 4) {
      const sorted = sortCells(game.selectedCells);
      if (isValidLPlacement(sorted, game.botL, game.neutrals) &&
          !cellsEqual(sorted, game.humanL)) {
        game.savedHumanL = game.humanL;
        game.pendingL = sorted;
        game.phase = "moveNeutral";
        game.selectedNeutralIndex = null;
        game.pendingNeutrals = null;
        undoBtn.disabled = false;
        doneBtn.disabled = false;
        render();
        updateStatus();
        return;
      }
    }
    game.selectedCells = [];
    render();
  }

  function handleNeutralClick(c, r) {
    const neutrals = game.pendingNeutrals || game.neutrals;

    if (game.selectedNeutralIndex === null) {
      const idx = neutrals.findIndex(p => p[0] === c && p[1] === r);
      if (idx !== -1) {
        game.selectedNeutralIndex = idx;
        render();
        updateStatus();
      }
      return;
    }

    const humanL = game.pendingL || game.humanL;
    if (humanL.some(p => p[0] === c && p[1] === r)) return;
    if (game.botL.some(p => p[0] === c && p[1] === r)) return;
    const otherIdx = 1 - game.selectedNeutralIndex;
    if (neutrals[otherIdx][0] === c && neutrals[otherIdx][1] === r) return;
    if (neutrals[game.selectedNeutralIndex][0] === c &&
        neutrals[game.selectedNeutralIndex][1] === r) {
      game.selectedNeutralIndex = null;
      render();
      updateStatus();
      return;
    }

    const newNeutrals = neutrals.slice();
    newNeutrals[game.selectedNeutralIndex] = [c, r];
    game.pendingNeutrals = sortCells(newNeutrals);
    game.selectedNeutralIndex = null;
    render();
    updateStatus();
  }

  // --- Buttons ---

  undoBtn.addEventListener("click", () => {
    if (game.savedHumanL) {
      game.phase = "placeL";
      game.pendingL = null;
      game.pendingNeutrals = null;
      game.selectedCells = [];
      game.selectedNeutralIndex = null;
      undoBtn.disabled = true;
      doneBtn.disabled = true;
      render();
      updateStatus();
    }
  });

  doneBtn.addEventListener("click", () => {
    if (!game.pendingL) return;

    const finalNeutrals = game.pendingNeutrals || game.neutrals;
    const legalMoves = generateMoves(game.humanL, game.botL, game.neutrals);
    const isLegal = legalMoves.some(m =>
      cellsEqual(m.active, game.pendingL) && cellsEqual(m.neutrals, finalNeutrals)
    );

    if (!isLegal) {
      setStatus("Illegal move! Try again.", "human-turn");
      return;
    }

    game.humanL = game.pendingL;
    game.neutrals = finalNeutrals;
    game.pendingL = null;
    game.pendingNeutrals = null;
    game.savedHumanL = null;
    game.selectedCells = [];
    game.selectedNeutralIndex = null;
    undoBtn.disabled = true;
    doneBtn.disabled = true;

    const botMoves = generateMoves(game.botL, game.humanL, game.neutrals);
    if (botMoves.length === 0) {
      game.phase = "gameOver";
      score.human++;
      humanScoreEl.textContent = score.human;
      setStatus("You win!", "win");
      render();
      return;
    }

    game.currentPlayer = "bot";
    game.phase = "botTurn";
    render();
    updateStatus();
    setTimeout(botMove, 500);
  });

  newGameBtn.addEventListener("click", newGame);

  // --- Bot AI ---

  function touchesCorner(lPiece) {
    return lPiece.some(([c, r]) =>
      (c === 0 || c === 3) && (r === 0 || r === 3)
    );
  }

  function weightedPick(candidates) {
    const weights = candidates.map(c => touchesCorner(c.move.active) ? 1 : 2);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  function botMove() {
    const moves = generateMoves(game.botL, game.humanL, game.neutrals);
    if (moves.length === 0) {
      game.phase = "gameOver";
      score.human++;
      humanScoreEl.textContent = score.human;
      setStatus("You win!", "win");
      render();
      return;
    }

    const scored = [];

    for (const m of moves) {
      const humanResponses = generateMoves(m.opponent, m.active, m.neutrals);

      if (humanResponses.length === 0) {
        scored.push({ move: m, score: 10000 });
        continue;
      }

      const loss = isLosingPosition(m.opponent, m.active, m.neutrals);
      if (loss) {
        scored.push({ move: m, score: 1000 - loss.movesLeft });
        continue;
      }

      let safe = true;
      let worstHumanDepth = Infinity;
      for (const hr of humanResponses) {
        const botLoss = isLosingPosition(hr.opponent, hr.active, hr.neutrals);
        if (botLoss) {
          safe = false;
          worstHumanDepth = Math.min(worstHumanDepth, botLoss.movesLeft);
        }
      }

      scored.push({ move: m, score: safe ? 0 : -100 + worstHumanDepth });
    }

    const bestScore = Math.max(...scored.map(s => s.score));
    const candidates = scored.filter(s => s.score === bestScore);
    const bestMove = weightedPick(candidates).move;

    game.botL = bestMove.active;
    game.neutrals = bestMove.neutrals;

    const humanMoves = generateMoves(game.humanL, game.botL, game.neutrals);
    if (humanMoves.length === 0) {
      game.phase = "gameOver";
      score.bot++;
      botScoreEl.textContent = score.bot;
      setStatus("Bot wins!", "lose");
      render();
      return;
    }

    game.currentPlayer = "human";
    game.phase = "placeL";
    render();
    updateStatus();
  }

  // --- Event listeners ---

  svg.addEventListener("pointerdown", onPointerDown);
  svg.addEventListener("pointermove", onPointerMove);
  svg.addEventListener("pointerup", onPointerUp);
  svg.addEventListener("pointerleave", (e) => {
    if (dragging) onPointerUp(e);
  });

  newGame();
}

if (typeof module !== "undefined") {
  module.exports = {
    BOARD_SIZE, SYMMETRIES, LOSING_POSITIONS, ALL_L_PLACEMENTS,
    sortCells, positionKey, canonicalize, isLosingPosition,
    isIsomorphic, generateMoves,
  };
}
