import { BOARD } from "@/lib/amida";
import styles from "./amida.module.css";

type GoalProps = {
  x: number;
  y: number;
  column: number;
  label: string;
  highlighted: boolean;
};

const SPARKS = [
  { x: -50, y: -34 },
  { x: 52, y: -28 },
  { x: -46, y: 36 },
  { x: 48, y: 34 },
];

export function Goal({ x, y, column, label, highlighted }: GoalProps) {
  return (
    <g transform={`translate(${x} ${y})`} data-col={column} data-prize={label}>
      <g className={highlighted ? styles.goalHot : undefined}>
        <rect
          className={highlighted ? styles.goalWin : styles.goalBox}
          x={-BOARD.goalWidth / 2}
          y={-BOARD.goalHeight / 2}
          width={BOARD.goalWidth}
          height={BOARD.goalHeight}
          rx={18}
        />
        <text
          className={highlighted ? styles.goalTextWin : styles.goalText}
          x={0}
          y={8}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {label}
        </text>
        {highlighted &&
          SPARKS.map((spark) => (
            <circle
              key={`${spark.x}-${spark.y}`}
              className={styles.spark}
              cx={spark.x}
              cy={spark.y}
              r={3.5}
            />
          ))}
      </g>
    </g>
  );
}
