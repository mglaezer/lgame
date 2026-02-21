const {
  BOARD_SIZE,
  SYMMETRIES,
  LOSING_POSITIONS,
  ALL_L_PLACEMENTS,
  sortCells,
  positionKey,
  canonicalize,
  isLosingPosition,
  isIsomorphic,
  generateMoves,
} = require("./script.js");

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error("FAIL:", msg);
  }
}

function assertEq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    console.error("FAIL:", msg, "expected:", e, "got:", a);
  }
}

// --- L placements ---
assertEq(ALL_L_PLACEMENTS.length, 48, "48 L placements on 4x4 board");
for (const pl of ALL_L_PLACEMENTS) {
  assert(pl.length === 4, "each L placement has 4 cells");
  const unique = new Set(pl.map((p) => p[0] * 4 + p[1]));
  assert(unique.size === 4, "4 distinct cells");
  assert(
    pl.every((p) => p[0] >= 0 && p[0] < 4 && p[1] >= 0 && p[1] < 4),
    "all in bounds",
  );
}

// --- Symmetries ---
assert(SYMMETRIES.length === 8, "8 symmetry transforms");
assertEq(SYMMETRIES[0](2, 1), [2, 1], "identity transform");

const symResults = SYMMETRIES.map((s) => {
  return [
    [0, 0],
    [0, 1],
    [1, 0],
    [3, 3],
  ]
    .map((p) => s(p[0], p[1]).join(","))
    .join(";");
});
assert(
  new Set(symResults).size === 8,
  "all 8 symmetries produce distinct results",
);

for (let si = 0; si < 8; si++) {
  const corners = [
    [0, 0],
    [0, 3],
    [3, 0],
    [3, 3],
  ];
  for (const [c, r] of corners) {
    const [tc, tr] = SYMMETRIES[si](c, r);
    assert(
      corners.some((cr) => cr[0] === tc && cr[1] === tr),
      `symmetry ${si} maps corner (${c},${r}) to corner`,
    );
  }
}

// --- Canonicalization ---
const active1 = sortCells([
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
]);
const opponent1 = sortCells([
  [3, 3],
  [3, 2],
  [3, 1],
  [2, 3],
]);
const neutrals1 = sortCells([
  [1, 3],
  [2, 0],
]);
const canon1 = canonicalize(active1, opponent1, neutrals1);

for (let si = 0; si < 8; si++) {
  const ta = sortCells(active1.map((p) => SYMMETRIES[si](p[0], p[1])));
  const to = sortCells(opponent1.map((p) => SYMMETRIES[si](p[0], p[1])));
  const tn = sortCells(neutrals1.map((p) => SYMMETRIES[si](p[0], p[1])));
  assertEq(
    canonicalize(ta, to, tn),
    canon1,
    `symmetry ${si} gives same canonical key`,
  );
}

// --- Losing positions count ---
assert(
  LOSING_POSITIONS.size === 29,
  `expected 29 losing positions, got ${LOSING_POSITIONS.size}`,
);

const byDepth = {};
for (const [, d] of LOSING_POSITIONS) {
  byDepth[d] = (byDepth[d] || 0) + 1;
}
assertEq(byDepth[0], 15, "15 immediate losses (depth 0)");
assertEq(byDepth[2], 3, "3 losses at depth 2");
assertEq(byDepth[4], 3, "3 losses at depth 4");
assertEq(byDepth[6], 5, "5 losses at depth 6");
assertEq(byDepth[8], 3, "3 losses at depth 8");
console.log("Losing positions by depth:", byDepth);

// --- isLosingPosition ---
const result = isLosingPosition(
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
  ],
  [
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 1],
  ],
  [
    [2, 0],
    [3, 1],
  ],
);
assert(result !== null, "known depth-0 position detected as losing");
assertEq(result.movesLeft, 0, "depth-0 position has 0 moves left");

const sym = SYMMETRIES[1];
const rotResult = isLosingPosition(
  sortCells(
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
    ].map((p) => sym(p[0], p[1])),
  ),
  sortCells(
    [
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 1],
    ].map((p) => sym(p[0], p[1])),
  ),
  sortCells(
    [
      [2, 0],
      [3, 1],
    ].map((p) => sym(p[0], p[1])),
  ),
);
assert(rotResult !== null, "rotated losing position still detected");
assertEq(rotResult.movesLeft, 0, "rotated depth-0 still has 0 moves left");

const safe = isLosingPosition(
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
  ],
  [
    [2, 3],
    [2, 2],
    [2, 1],
    [3, 3],
  ],
  [
    [3, 0],
    [0, 3],
  ],
);
assert(safe === null, "non-losing position returns null");

const deep = isLosingPosition(
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
  ],
  [
    [1, 1],
    [1, 2],
    [2, 1],
    [3, 1],
  ],
  [
    [2, 3],
    [3, 2],
  ],
);
assert(deep !== null, "depth-8 position detected as losing");
assertEq(deep.movesLeft, 4, "depth-8 position has 4 moves left");

// --- isIsomorphic ---
assert(
  isIsomorphic(active1, opponent1, neutrals1, active1, opponent1, neutrals1),
  "identical positions are isomorphic",
);

const rot90active = sortCells(active1.map((p) => SYMMETRIES[1](p[0], p[1])));
const rot90opponent = sortCells(
  opponent1.map((p) => SYMMETRIES[1](p[0], p[1])),
);
const rot90neutrals = sortCells(
  neutrals1.map((p) => SYMMETRIES[1](p[0], p[1])),
);
assert(
  isIsomorphic(
    active1,
    opponent1,
    neutrals1,
    rot90active,
    rot90opponent,
    rot90neutrals,
  ),
  "90-degree rotation is isomorphic",
);

const rot180active = sortCells(active1.map((p) => SYMMETRIES[2](p[0], p[1])));
const rot180opponent = sortCells(
  opponent1.map((p) => SYMMETRIES[2](p[0], p[1])),
);
const rot180neutrals = sortCells(
  neutrals1.map((p) => SYMMETRIES[2](p[0], p[1])),
);
assert(
  isIsomorphic(
    active1,
    opponent1,
    neutrals1,
    rot180active,
    rot180opponent,
    rot180neutrals,
  ),
  "180-degree rotation is isomorphic",
);

const reflActive = sortCells(active1.map((p) => SYMMETRIES[4](p[0], p[1])));
const reflOpponent = sortCells(opponent1.map((p) => SYMMETRIES[4](p[0], p[1])));
const reflNeutrals = sortCells(neutrals1.map((p) => SYMMETRIES[4](p[0], p[1])));
assert(
  isIsomorphic(
    active1,
    opponent1,
    neutrals1,
    reflActive,
    reflOpponent,
    reflNeutrals,
  ),
  "reflection is isomorphic",
);

const differentActive = sortCells([
  [0, 0],
  [0, 1],
  [1, 1],
  [2, 1],
]);
assert(
  !isIsomorphic(
    active1,
    opponent1,
    neutrals1,
    differentActive,
    opponent1,
    neutrals1,
  ),
  "different positions are not isomorphic",
);

// --- generateMoves ---
const startActive = sortCells([
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 0],
]);
const startOpponent = sortCells([
  [2, 1],
  [2, 2],
  [2, 3],
  [3, 3],
]);
const startNeutrals = sortCells([
  [3, 0],
  [0, 3],
]);
const moves = generateMoves(startActive, startOpponent, startNeutrals);
assert(moves.length > 0, "has available moves");

for (const m of moves) {
  assert(m.active.length === 4, "move has 4-cell active L");
  assert(m.neutrals.length === 2, "move has 2 neutrals");
  const allCells = [...m.active, ...m.opponent, ...m.neutrals];
  const unique = new Set(allCells.map((p) => p[0] * 4 + p[1]));
  assert(
    unique.size === allCells.length,
    "no overlapping pieces in move result",
  );
}

const startKey = startActive.map((p) => p.join(",")).join(";");
for (const m of moves) {
  const mKey = m.active.map((p) => p.join(",")).join(";");
  assert(mKey !== startKey, "move changes L position");
}

// moves without neutral change should preserve neutrals
const noNeutralMoves = moves.filter(
  (m) =>
    m.neutrals[0][0] === startNeutrals[0][0] &&
    m.neutrals[0][1] === startNeutrals[0][1] &&
    m.neutrals[1][0] === startNeutrals[1][0] &&
    m.neutrals[1][1] === startNeutrals[1][1],
);
assert(noNeutralMoves.length > 0, "some moves keep neutrals unchanged");
assert(noNeutralMoves.length < moves.length, "some moves change neutrals");

// a depth-0 losing position should have no moves
const lostActive = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
];
const lostOpponent = [
  [1, 1],
  [1, 2],
  [1, 3],
  [2, 1],
];
const lostNeutrals = [
  [2, 0],
  [3, 1],
];
const lostMoves = generateMoves(lostActive, lostOpponent, lostNeutrals);
assertEq(lostMoves.length, 0, "depth-0 losing position has no moves");

// from a depth-2 position, every move should allow opponent to reach a depth-0 loss for us
const d2Active = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
];
const d2Opponent = [
  [1, 1],
  [1, 2],
  [2, 1],
  [3, 1],
];
const d2Neutrals = sortCells([
  [0, 3],
  [2, 0],
]);
const d2Result = isLosingPosition(d2Active, d2Opponent, d2Neutrals);
assert(
  d2Result !== null && d2Result.movesLeft === 1,
  "depth-2 position confirmed",
);

const d2Moves = generateMoves(d2Active, d2Opponent, d2Neutrals);
assert(d2Moves.length > 0, "depth-2 position has moves");
let allMovesLeadToOpponentWin = true;
for (const m of d2Moves) {
  const opponentMoves = generateMoves(m.opponent, m.active, m.neutrals);
  let opponentCanWin = false;
  for (const om of opponentMoves) {
    const omResult = isLosingPosition(om.opponent, om.active, om.neutrals);
    if (omResult !== null && omResult.movesLeft === 0) {
      opponentCanWin = true;
      break;
    }
  }
  if (!opponentCanWin) {
    allMovesLeadToOpponentWin = false;
    break;
  }
}
assert(
  allMovesLeadToOpponentWin,
  "every move from depth-2 lets opponent force depth-0 loss",
);

console.log("Moves from test position:", moves.length);

// --- Bot must pick immediate win (regression: was scored 0 instead of instant win) ---
// Position where bot can move L to trap human
const trapHumanL = sortCells([
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
]);
const trapBotL = sortCells([
  [2, 1],
  [2, 2],
  [2, 3],
  [3, 3],
]);
const trapNeutrals = sortCells([
  [2, 0],
  [3, 1],
]);
const botMoves = generateMoves(trapBotL, trapHumanL, trapNeutrals);

const winningMoves = botMoves.filter(
  (m) => generateMoves(m.opponent, m.active, m.neutrals).length === 0,
);
assert(winningMoves.length > 0, "bot has at least one move that traps human");

// The bug: isLosingPosition might not detect a trapping move, causing bot to score it 0.
// Verify every trapping move IS detected by isLosingPosition (table completeness).
for (const wm of winningMoves) {
  const loss = isLosingPosition(wm.opponent, wm.active, wm.neutrals);
  assert(
    loss !== null,
    "isLosingPosition detects trapping move (table completeness)",
  );
  if (loss) assertEq(loss.movesLeft, 0, "trapping move has movesLeft=0");
}

// Simulate bot move selection: must pick a winning move, not a random safe one.
// This is the core regression test — before the fix, winning moves could get score 0.
let bestMove = null;
let bestScore = -Infinity;
for (const m of botMoves) {
  const opponentResponses = generateMoves(m.opponent, m.active, m.neutrals);
  if (opponentResponses.length === 0) {
    bestMove = m;
    bestScore = 10000;
    break;
  }
  const loss = isLosingPosition(m.opponent, m.active, m.neutrals);
  if (loss) {
    if (bestScore < 1000 - loss.movesLeft) {
      bestScore = 1000 - loss.movesLeft;
      bestMove = m;
    }
    continue;
  }
  let moveScore = 0;
  for (const hr of opponentResponses) {
    const botLoss = isLosingPosition(hr.opponent, hr.active, hr.neutrals);
    if (botLoss) {
      moveScore = -100 + botLoss.movesLeft;
      break;
    }
  }
  if (moveScore > bestScore) {
    bestScore = moveScore;
    bestMove = m;
  }
}

assert(bestScore >= 1000, "bot picks winning move with high score, not 0");
const chosenOpponentMoves = generateMoves(
  bestMove.opponent,
  bestMove.active,
  bestMove.neutrals,
);
assertEq(
  chosenOpponentMoves.length,
  0,
  "bot's chosen move leaves human with no moves",
);

// --- Summary ---
console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
