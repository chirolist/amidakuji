"use client";

import { useId, type Ref } from "react";
import {
  BOARD,
  PRIZES,
  bridgeMetrics,
  bridgeY,
  columnX,
  lineBottom,
  verticalMetrics,
  type AmidaLayout,
  type GameState,
  type Point,
} from "@/lib/amida";
import { Goal } from "./Goal";
import { PlayerMarker } from "./PlayerMarker";
import { StartPoint } from "./StartPoint";
import styles from "./amida.module.css";

type Marker = {
  x: number;
  y: number;
  trail: Point[];
};

type AmidaBoardProps = {
  layout: AmidaLayout | null;
  gameState: GameState;
  revealProgress: number;
  selectedCol: number | null;
  highlightCol: number | null;
  marker: Marker | null;
  arrived: boolean;
  canSelect: boolean;
  onSelect: (column: number) => void;
  startRef?: Ref<SVGGElement>;
};

function polyline(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function AmidaBoard({
  layout,
  gameState,
  revealProgress,
  selectedCol,
  highlightCol,
  marker,
  arrived,
  canSelect,
  onSelect,
  startRef,
}: AmidaBoardProps) {
  const glowId = `marker-glow-${useId().replace(/:/g, "")}`;
  const showStructure = gameState !== "ready" && revealProgress > 0;
  const vertical = verticalMetrics(revealProgress);
  const bridges = layout?.bridges ?? [];

  return (
    <div className={styles.boardWrap}>
      <svg
        className={styles.board}
        viewBox={`0 0 ${BOARD.width} ${BOARD.height}`}
        role="group"
        aria-label="あみだくじの盤面"
        data-state={gameState}
        data-bridges={
          layout && gameState !== "ready"
            ? bridges.map((bridge) => `${bridge.row}-${bridge.leftCol}`).join(",")
            : undefined
        }
      >
        <defs>
          <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {showStructure &&
          Array.from({ length: BOARD.columnCount }, (_, column) => (
            <path
              key={`vertical-${column}`}
              className={styles.line}
              data-kind="vertical"
              d={`M ${columnX(column)} ${BOARD.startY} L ${columnX(column)} ${lineBottom()}`}
              strokeDasharray={vertical.length}
              strokeDashoffset={vertical.offset}
            />
          ))}

        {showStructure &&
          bridges.map((bridge) => {
            const metrics = bridgeMetrics(revealProgress, bridge.row);
            if (metrics.shownRatio <= 0) return null;
            const y = bridgeY(bridge.row);
            const x1 = columnX(bridge.leftCol);
            const x2 = columnX(bridge.leftCol + 1);
            return (
              <path
                key={`bridge-${bridge.row}-${bridge.leftCol}`}
                className={styles.line}
                data-kind="bridge"
                d={`M ${x1} ${y} L ${x2} ${y}`}
                strokeDasharray={metrics.length}
                strokeDashoffset={metrics.offset}
              />
            );
          })}

        {marker && marker.trail.length > 1 && (
          <polyline className={styles.trail} points={polyline(marker.trail)} />
        )}

        {gameState === "ready" && (
          <text className={styles.hint} x={BOARD.width / 2} y={300} textAnchor="middle" aria-hidden="true">
            タップすると道が現れます
          </text>
        )}

        {PRIZES.map((prize, column) => (
          <Goal
            key={prize}
            x={columnX(column)}
            y={BOARD.goalCenterY}
            column={column}
            label={prize}
            highlighted={highlightCol === column}
          />
        ))}

        {Array.from({ length: BOARD.columnCount }, (_, column) => (
          <StartPoint
            key={column}
            x={columnX(column)}
            y={BOARD.startY}
            index={column}
            selected={selectedCol === column}
            dimmed={selectedCol !== null && selectedCol !== column}
            disabled={!canSelect}
            onSelect={onSelect}
            elementRef={column === 0 ? startRef : undefined}
          />
        ))}

        {marker && (gameState === "moving" || gameState === "result") && (
          <PlayerMarker x={marker.x} y={marker.y} arrived={arrived} glowId={glowId} />
        )}
      </svg>
    </div>
  );
}
