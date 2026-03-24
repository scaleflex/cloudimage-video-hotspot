import React from 'react';

interface TimelineRulerProps {
  duration: number;
  onSeek: (time: number) => void;
  zoomLevel?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TimelineRuler({ duration, onSeek, zoomLevel = 1 }: TimelineRulerProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    onSeek(frac * duration);
  };

  const ticks: { pos: number; label: string; major: boolean }[] = [];
  if (duration > 0) {
    const baseInterval = duration <= 30 ? 5 : duration <= 120 ? 10 : 30;
    const interval = baseInterval / zoomLevel;
    const minInterval = 1;
    const actualInterval = Math.max(interval, minInterval);
    for (let t = 0; t <= duration; t += actualInterval) {
      ticks.push({
        pos: (t / duration) * 100,
        label: formatTime(t),
        major: true,
      });
    }
  }

  return (
    <div className="editor-timeline__ruler" onClick={handleClick} style={{ width: `${zoomLevel * 100}%` }}>
      {ticks.map((tick, i) => (
        <React.Fragment key={i}>
          <div
            className="editor-timeline__ruler-tick"
            style={{ left: `${tick.pos}%`, height: tick.major ? 12 : 6 }}
          />
          {tick.major && (
            <span
              className="editor-timeline__ruler-label"
              style={{ left: `${tick.pos}%` }}
            >
              {tick.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
