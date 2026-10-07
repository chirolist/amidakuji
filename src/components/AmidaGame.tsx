"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PRIZES,
  buildPath,
  generateAmida,
  layoutKey,
  pathLength,
  pointAtDistance,
  slicePath,
  trace,
  type AmidaLayout,
  type GameState,
  type Point,
} from "@/lib/amida";
import { AmidaBoard } from "./AmidaBoard";
import { ResultModal } from "./ResultModal";
import styles from "./amida.module.css";

type Marker = {
  x: number;
  y: number;
  trail: Point[];
};

const REVEAL_MS = 1200;
const REVEAL_HOLD_MS = 180;
const MOVE_PX_PER_SEC = 220;
const LANDING_PAUSE_MS = 560;

function durationScale(): number {
  if (typeof window === "undefined") return 1;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.34 : 1;
}

export function AmidaGame() {
  const [layout, setLayout] = useState<AmidaLayout | null>(null);
  const [gameState, setGameState] = useState<GameState>("ready");
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [revealProgress, setRevealProgress] = useState(0);
  const [marker, setMarker] = useState<Marker | null>(null);
  const [arrived, setArrived] = useState(false);
  const lockRef = useRef(false);
  const startRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setLayout(generateAmida());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const destination = useMemo(() => {
    if (!layout || selectedCol === null) return null;
    return trace(layout, selectedCol);
  }, [layout, selectedCol]);

  useEffect(() => {
    if (gameState !== "revealing" || !layout || selectedCol === null) return;

    const scale = durationScale();
    const duration = REVEAL_MS * scale;
    let frame = 0;
    let timer = 0;
    let cancelled = false;
    const start = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const progress = Math.min(1, (now - start) / duration);
      setRevealProgress(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      timer = window.setTimeout(() => {
        if (!cancelled) setGameState("moving");
      }, REVEAL_HOLD_MS * scale);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [gameState, layout, selectedCol]);

  useEffect(() => {
    if (gameState !== "moving" || !layout || selectedCol === null) return;

    const path = buildPath(layout, selectedCol);
    const scale = durationScale();
    const total = Math.max(1, pathLength(path));
    const duration = (total / MOVE_PX_PER_SEC) * 1000 * scale;
    let frame = 0;
    let timer = 0;
    let cancelled = false;
    const start = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const progress = Math.min(1, (now - start) / duration);
      const distance = total * progress;
      const point = pointAtDistance(path, distance);
      setMarker({
        x: point.x,
        y: point.y,
        trail: slicePath(path, distance),
      });
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      setArrived(true);
      timer = window.setTimeout(() => {
        if (!cancelled) setGameState("result");
      }, LANDING_PAUSE_MS * scale);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [gameState, layout, selectedCol]);

  const selectStart = (column: number) => {
    if (!layout || gameState !== "ready" || lockRef.current) return;
    lockRef.current = true;
    const path = buildPath(layout, column);
    setSelectedCol(column);
    setRevealProgress(0);
    setArrived(false);
    setMarker({
      x: path[0].x,
      y: path[0].y,
      trail: [path[0]],
    });
    setGameState("revealing");
  };

  const replay = () => {
    if (!layout || gameState !== "result") return;
    setLayout(generateAmida(layoutKey(layout)));
    setGameState("ready");
    setSelectedCol(null);
    setRevealProgress(0);
    setMarker(null);
    setArrived(false);
    lockRef.current = false;
    requestAnimationFrame(() => startRef.current?.focus());
  };

  const status =
    gameState === "ready"
      ? "好きなスタートをタップ"
      : gameState === "revealing"
        ? "道が現れています"
        : gameState === "moving" && !arrived
          ? "ゴールへ進んでいます"
          : "";

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <h1 className={styles.title}>あみだくじ</h1>
          <p className={styles.status} aria-live="polite">
            {status}
          </p>
        </header>
        <AmidaBoard
          layout={layout}
          gameState={gameState}
          revealProgress={gameState === "ready" ? 0 : revealProgress}
          selectedCol={selectedCol}
          highlightCol={arrived ? destination : null}
          marker={marker}
          arrived={arrived}
          canSelect={layout !== null && gameState === "ready"}
          onSelect={selectStart}
          startRef={startRef}
        />
      </div>
      {gameState === "result" && destination !== null && (
        <ResultModal prize={PRIZES[destination]} onReplay={replay} />
      )}
    </main>
  );
}
