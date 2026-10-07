import type { Ref } from "react";
import styles from "./amida.module.css";

type StartPointProps = {
  x: number;
  y: number;
  index: number;
  selected: boolean;
  dimmed: boolean;
  disabled: boolean;
  onSelect: (index: number) => void;
  elementRef?: Ref<SVGGElement>;
};

export function StartPoint({
  x,
  y,
  index,
  selected,
  dimmed,
  disabled,
  onSelect,
  elementRef,
}: StartPointProps) {
  const select = () => {
    if (!disabled) onSelect(index);
  };

  return (
    <g
      ref={elementRef}
      className={`${styles.start} ${dimmed ? styles.dimmed : ""}`}
      transform={`translate(${x} ${y}) scale(${selected ? 1.08 : 1})`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`スタート ${index + 1}`}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={select}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select();
      }}
    >
      <text
        className={selected ? styles.startLabelActive : styles.startLabel}
        x={0}
        y={-34}
        textAnchor="middle"
      >
        START
      </text>
      {selected && <circle className={styles.halo} r={30} />}
      <circle
        className={`${styles.dot} ${selected ? styles.dotSelected : ""} ${
          !disabled && !selected ? styles.idleDot : ""
        }`}
        style={{ animationDelay: `${index * 0.18}s` }}
        r={18}
      />
      <circle className={styles.focusRing} r={24} />
      <rect className={styles.hit} x={-46} y={-50} width={92} height={78} />
    </g>
  );
}
