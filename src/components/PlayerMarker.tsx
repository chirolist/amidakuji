import styles from "./amida.module.css";

type PlayerMarkerProps = {
  x: number;
  y: number;
  arrived: boolean;
  glowId: string;
};

export function PlayerMarker({ x, y, arrived, glowId }: PlayerMarkerProps) {
  return (
    <g transform={`translate(${x} ${y})`} data-x={x} data-y={y} data-marker="true">
      <g className={arrived ? styles.markerPop : undefined} filter={`url(#${glowId})`}>
        <circle className={styles.markerGlow} r={18} />
        <circle className={styles.markerCore} r={13} />
        <circle className={styles.markerHot} r={3.5} />
      </g>
    </g>
  );
}
