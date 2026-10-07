"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Prize } from "@/lib/amida";
import styles from "./amida.module.css";

type ResultModalProps = {
  prize: Prize;
  onReplay: () => void;
};

const PALETTE = ["#f47a1f", "#ffb703", "#ff6b6b", "#ffe8c7", "#ff8fab", "#ffd6a5"];

const CONFETTI = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  left: `${4 + ((index * 37) % 90)}%`,
  delay: `${(index % 8) * 0.045}s`,
  duration: `${0.95 + (index % 5) * 0.14}s`,
  color: PALETTE[index % PALETTE.length],
  drift: `${(index % 2 === 0 ? 1 : -1) * (14 + (index % 6) * 11)}px`,
  spin: `${160 + (index % 8) * 45}deg`,
  width: index % 3 === 0 ? 7 : 9,
  height: index % 2 === 0 ? 12 : 16,
}));

export function ResultModal({ prize, onReplay }: ResultModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div className={styles.backdrop}>
      <div className={styles.confetti} aria-hidden="true">
        {CONFETTI.map((piece) => (
          <span
            key={piece.id}
            className={styles.piece}
            style={
              {
                left: piece.left,
                background: piece.color,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                width: piece.width,
                height: piece.height,
                "--drift": piece.drift,
                "--spin": piece.spin,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <p className={styles.emoji} aria-hidden="true">
          🎉
        </p>
        <p className={styles.kicker}>結果</p>
        <h2 id="result-title" className={styles.prize}>
          {prize}！
        </h2>
        <p className={styles.congrats}>おめでとうございます！</p>
        <button ref={buttonRef} type="button" className={styles.replay} onClick={onReplay}>
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
}
