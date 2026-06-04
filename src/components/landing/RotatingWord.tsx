"use client";

import { useEffect, useState } from "react";

const WORDS = ["Restaurants", "Hotels", "Pensionen"];
const INTERVAL_MS = 3000;

export function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 350);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <span
      style={{
        display: "inline-block",
        color: "#C8963E",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
        minWidth: "12ch",
        textAlign: "left",
      }}
    >
      {WORDS[index]}
    </span>
  );
}
