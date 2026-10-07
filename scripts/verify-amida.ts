import assert from "node:assert/strict";
import {
  BOARD,
  bridgeShownRatio,
  buildPath,
  columnX,
  distance,
  generateAmida,
  layoutKey,
  lineBottom,
  pathLength,
  pointAtDistance,
  slicePath,
  trace,
  verticalMetrics,
  type AmidaLayout,
  type Point,
} from "../src/lib/amida.ts";

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assertAxisAligned(points: Point[]): void {
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const sameX = Math.abs(previous.x - current.x) < 0.001;
    const sameY = Math.abs(previous.y - current.y) < 0.001;
    assert.equal(sameX || sameY, true, "segment must be vertical or horizontal");
    assert.equal(sameX && sameY, false, "segment must have length");
    if (sameX) assert.ok(current.y > previous.y, "vertical movement goes downward");
  }
}

function assertFollowsBridges(layout: AmidaLayout, start: number): void {
  const points = buildPath(layout, start);
  const endColumn = trace(layout, start);
  assert.ok(endColumn >= 0 && endColumn < 3);
  assert.ok(Math.abs(points[0].x - columnX(start)) < 0.001);
  assert.ok(Math.abs(points[0].y - BOARD.startY) < 0.001);
  assert.ok(Math.abs(points[points.length - 1].x - columnX(endColumn)) < 0.001);
  assert.ok(Math.abs(points[points.length - 1].y - lineBottom()) < 0.001);
  assertAxisAligned(points);

  let column = start;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (Math.abs(previous.y - current.y) < 0.001) {
      const row = layout.bridges.find(
        (bridge) => Math.abs(bridge.row * BOARD.bridgeGap + BOARD.bridgeTop - current.y) < 0.001,
      );
      assert.ok(row, "horizontal move must sit on a bridge");
      const connected = row.leftCol === column || row.leftCol + 1 === column;
      assert.equal(connected, true);
      const next = row.leftCol === column ? column + 1 : column - 1;
      assert.ok(Math.abs(current.x - columnX(next)) < 0.001);
      column = next;
    }
  }
  assert.equal(column, endColumn);

  const total = pathLength(points);
  assert.ok(Math.abs(pointAtDistance(points, 0).y - points[0].y) < 0.001);
  const end = pointAtDistance(points, total);
  assert.ok(Math.abs(end.x - points[points.length - 1].x) < 0.001);
  assert.ok(Math.abs(end.y - points[points.length - 1].y) < 0.001);

  const samples = 12;
  for (let step = 0; step <= samples; step += 1) {
    const point = pointAtDistance(points, (total * step) / samples);
    const onSegment = points.some((startPoint, index) => {
      if (index === points.length - 1) return false;
      const endPoint = points[index + 1];
      const segment = distance(startPoint, endPoint);
      const through = distance(startPoint, point) + distance(point, endPoint);
      return Math.abs(through - segment) < 0.01;
    });
    assert.equal(onSegment, true, "sample must stay on the path");
  }

  const sliced = slicePath(points, total / 2);
  assert.ok(sliced.length >= 2);
  assert.ok(Math.abs(sliced[0].x - points[0].x) < 0.001);
}

function assertLayout(layout: AmidaLayout): void {
  const rows = layout.bridges.map((bridge) => bridge.row);
  assert.equal(new Set(rows).size, rows.length, "one bridge per row");
  for (const bridge of layout.bridges) {
    assert.ok(bridge.leftCol === 0 || bridge.leftCol === 1);
    assert.ok(bridge.row >= 0 && bridge.row < BOARD.bridgeRows);
  }
  const ends = [0, 1, 2].map((start) => {
    assertFollowsBridges(layout, start);
    return trace(layout, start);
  });
  assert.equal(new Set(ends).size, 3);
  assert.equal(
    ends.every((end, index) => end === index),
    false,
  );
}

const keys = new Set<string>();
const destinations = new Set<number>();
let sawLeft = false;
let sawRight = false;

for (let index = 0; index < 300; index += 1) {
  const layout = generateAmida(undefined, mulberry32(index + 1));
  assertLayout(layout);
  keys.add(layoutKey(layout));
  for (const bridge of layout.bridges) {
    if (bridge.leftCol === 0) sawLeft = true;
    if (bridge.leftCol === 1) sawRight = true;
  }
  destinations.add(trace(layout, 0));
}

assert.ok(keys.size > 20, `expected variety, got ${keys.size}`);
assert.equal(sawLeft, true);
assert.equal(sawRight, true);
assert.ok(destinations.size === 3);

let previous = generateAmida(undefined, mulberry32(99));
for (let index = 0; index < 30; index += 1) {
  const next = generateAmida(layoutKey(previous), mulberry32(200 + index));
  assert.notEqual(layoutKey(next), layoutKey(previous));
  assertLayout(next);
  previous = next;
}

assert.equal(verticalMetrics(0).shown, 0);
assert.ok(Math.abs(verticalMetrics(1).shown - (lineBottom() - BOARD.startY)) < 0.001);
for (let row = 0; row < BOARD.bridgeRows; row += 1) {
  assert.equal(bridgeShownRatio(0, row), 0);
  assert.equal(bridgeShownRatio(1, row), 1);
}

assert.ok(Math.abs(columnX(1) - columnX(0) - (columnX(2) - columnX(1))) < 0.001);

const fallback = generateAmida(undefined, () => 0.99);
assertLayout(fallback);
const otherFallback = generateAmida(layoutKey(fallback), () => 0.99);
assert.notEqual(layoutKey(otherFallback), layoutKey(fallback));
assertLayout(otherFallback);

console.log(`ok ${keys.size} unique layouts`);
