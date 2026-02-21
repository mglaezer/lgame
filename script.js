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

if (typeof module !== "undefined") {
  module.exports = {
    BOARD_SIZE, SYMMETRIES, LOSING_POSITIONS, ALL_L_PLACEMENTS,
    sortCells, positionKey, canonicalize, isLosingPosition,
    isIsomorphic, generateMoves,
  };
}
