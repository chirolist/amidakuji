export const PRIZES = ["1等", "2等", "3等"] as const;

export type Prize = (typeof PRIZES)[number];

export type GameState = "ready" | "revealing" | "moving" | "result";

export type Bridge = {
  row: number;
  leftCol: 0 | 1;
};

export type AmidaLayout = {
  bridges: Bridge[];
};

export type Point = {
  x: number;
  y: number;
};

export const BOARD = {
  width: 400,
  height: 600,
  columnCount: 3,
  bridgeRows: 6,
  columnInset: 72,
  startY: 58,
  bridgeTop: 118,
  bridgeGap: 52,
  goalCenterY: 548,
  goalWidth: 112,
  goalHeight: 72,
} as const;

const FALLBACKS: AmidaLayout[] = [
  {
    bridges: [
      { row: 0, leftCol: 0 },
      { row: 2, leftCol: 1 },
      { row: 4, leftCol: 0 },
    ],
  },
  {
    bridges: [
      { row: 1, leftCol: 1 },
      { row: 3, leftCol: 0 },
      { row: 5, leftCol: 1 },
    ],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function columnX(column: number): number {
  const inner = BOARD.width - BOARD.columnInset * 2;
  return BOARD.columnInset + (inner * column) / (BOARD.columnCount - 1);
}

export function bridgeY(row: number): number {
  return BOARD.bridgeTop + BOARD.bridgeGap * row;
}

export function goalTop(): number {
  return BOARD.goalCenterY - BOARD.goalHeight / 2;
}

export function lineBottom(): number {
  return goalTop();
}

export function layoutKey(layout: AmidaLayout): string {
  return [...layout.bridges]
    .sort((a, b) => a.row - b.row || a.leftCol - b.leftCol)
    .map((bridge) => `${bridge.row}:${bridge.leftCol}`)
    .join("|");
}

export function walkAmida(
  layout: AmidaLayout,
  startCol: number,
): { points: Point[]; column: number } {
  const bridgesByRow = new Map(layout.bridges.map((bridge) => [bridge.row, bridge]));
  const points: Point[] = [{ x: columnX(startCol), y: BOARD.startY }];
  let column = startCol;

  for (let row = 0; row < BOARD.bridgeRows; row += 1) {
    const bridge = bridgesByRow.get(row);
    if (!bridge) continue;
    if (bridge.leftCol !== column && bridge.leftCol + 1 !== column) continue;

    const y = bridgeY(row);
    points.push({ x: columnX(column), y });
    column = bridge.leftCol === column ? column + 1 : column - 1;
    points.push({ x: columnX(column), y });
  }

  points.push({ x: columnX(column), y: lineBottom() });
  return { points, column };
}

export function buildPath(layout: AmidaLayout, startCol: number): Point[] {
  return walkAmida(layout, startCol).points;
}

export function trace(layout: AmidaLayout, startCol: number): number {
  return walkAmida(layout, startCol).column;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function pathLength(points: Point[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1], points[index]);
  }
  return total;
}

export function pointAtDistance(points: Point[], target: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (target <= 0) return points[0];

  let remaining = target;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = distance(start, end);
    if (length === 0) continue;
    if (remaining <= length || index === points.length - 2) {
      const t = clamp(remaining / length, 0, 1);
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      };
    }
    remaining -= length;
  }

  return points[points.length - 1];
}

export function slicePath(points: Point[], target: number): Point[] {
  if (points.length === 0) return [];

  const sliced: Point[] = [points[0]];
  let remaining = Math.max(0, target);

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = distance(start, end);
    if (length === 0) continue;
    if (remaining < length) {
      const t = remaining / length;
      sliced.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      });
      return sliced;
    }
    sliced.push(end);
    remaining -= length;
  }

  return sliced;
}

export function verticalMetrics(progress: number): {
  length: number;
  offset: number;
  shown: number;
} {
  const length = lineBottom() - BOARD.startY;
  const shown = length * clamp(progress, 0, 1);
  return { length, offset: Math.max(0, length - shown), shown };
}

export function bridgeShownRatio(progress: number, row: number): number {
  if (progress >= 1) return 1;
  const span = lineBottom() - BOARD.startY;
  const front = BOARD.startY + span * clamp(progress, 0, 1);
  return clamp((front - bridgeY(row)) / 90, 0, 1);
}

export function bridgeMetrics(
  progress: number,
  row: number,
): { length: number; offset: number; shownRatio: number } {
  const length = columnX(1) - columnX(0);
  const shownRatio = bridgeShownRatio(progress, row);
  return {
    length,
    offset: length * (1 - shownRatio),
    shownRatio,
  };
}

function randomLayout(random: () => number): AmidaLayout {
  const bridges: Bridge[] = [];
  for (let row = 0; row < BOARD.bridgeRows; row += 1) {
    if (random() >= 0.62) continue;
    bridges.push({
      row,
      leftCol: random() < 0.5 ? 0 : 1,
    });
  }
  return { bridges };
}

function isPlayable(layout: AmidaLayout): boolean {
  if (layout.bridges.length < 2) return false;

  const rows = new Set<number>();
  for (const bridge of layout.bridges) {
    if (bridge.row < 0 || bridge.row >= BOARD.bridgeRows) return false;
    if (bridge.leftCol !== 0 && bridge.leftCol !== 1) return false;
    if (rows.has(bridge.row)) return false;
    rows.add(bridge.row);
  }

  const ends = [0, 1, 2].map((start) => trace(layout, start));
  if (ends.some((end) => end < 0 || end >= BOARD.columnCount)) return false;
  if (new Set(ends).size !== BOARD.columnCount) return false;
  if (ends.every((end, index) => end === index)) return false;
  return true;
}

export function generateAmida(
  previousKey?: string,
  random: () => number = Math.random,
): AmidaLayout {
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const layout = randomLayout(random);
    if (!isPlayable(layout)) continue;
    if (previousKey && layoutKey(layout) === previousKey) continue;
    return layout;
  }

  return FALLBACKS.find((layout) => layoutKey(layout) !== previousKey) ?? FALLBACKS[0];
}
