import React, { useEffect, useMemo, useRef } from "react";

const levels = ["#1f2937", "#0f5132", "#15803d", "#22c55e", "#86efac"];

const ActivityTrackerCanvas = ({
  days = 112,
  cell = 12,
  gap = 4,
  data = [],
}) => {
  const canvasRef = useRef(null);

  const activity = useMemo(() => {
    if (data.length) return data;
    return Array.from({ length: days }).map((_, index) => ({
      date: index,
      count: index % 11 === 0 ? 0 : (index * 7 + 3) % 5,
    }));
  }, [data, days]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const columns = Math.ceil(activity.length / 7);
    const width = columns * (cell + gap);
    const height = 7 * (cell + gap);
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);

    activity.forEach((item, index) => {
      const column = Math.floor(index / 7);
      const row = index % 7;
      const x = column * (cell + gap);
      const y = row * (cell + gap);
      const level = Math.max(0, Math.min(4, Number(item.count || 0)));

      ctx.fillStyle = levels[level];
      ctx.beginPath();
      ctx.roundRect(x, y, cell, cell, 3);
      ctx.fill();
    });
  }, [activity, cell, gap]);

  return (
    <div className="overflow-x-auto pb-2">
      <canvas ref={canvasRef} aria-label="Study activity heatmap" />
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        {levels.map((color) => (
          <span
            key={color}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityTrackerCanvas;
