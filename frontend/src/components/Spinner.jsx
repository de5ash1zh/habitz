import React from "react";

export default function Spinner({ size = 24 }) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <span className="spin" style={{ width: s, height: s }} aria-label="Loading" />
  );
}
