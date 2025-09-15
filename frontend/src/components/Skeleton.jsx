import React from "react";

export default function Skeleton({ height = 16, width = "100%", rounded = 8, style = {} }) {
  const h = typeof height === "number" ? `${height}px` : height;
  const w = typeof width === "number" ? `${width}px` : width;
  const r = typeof rounded === "number" ? `${rounded}px` : rounded;
  return (
    <div className="skeleton" style={{ height: h, width: w, borderRadius: r, ...style }} />
  );
}
