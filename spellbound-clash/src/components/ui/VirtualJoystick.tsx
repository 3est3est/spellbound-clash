import { useCallback, useRef, useState } from "react";
import { useIsTouch } from "../../hooks/useIsTouch";

interface Props {
  onMove: (x: number, y: number) => void;
}

const RADIUS = 56;
const KNOB = 32;

export default function VirtualJoystick({ onMove }: Props) {
  const isTouch = useIsTouch();
  const elRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = useCallback(
    (clientX: number, clientY: number) => {
      const el = elRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > RADIUS) {
        dx = (dx / len) * RADIUS;
        dy = (dy / len) * RADIUS;
      }
      setKnob({ x: dx, y: dy });
      onMove(dx / RADIUS, dy / RADIUS);
    },
    [onMove]
  );

  const release = useCallback(() => {
    activeRef.current = false;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  if (!isTouch) return null;

  return (
    <div
      ref={elRef}
      className="fixed bottom-8 left-8 z-[90] select-none touch-none"
      style={{ width: RADIUS * 2, height: RADIUS * 2 }}
      onPointerDown={(e) => {
        e.preventDefault();
        activeRef.current = true;
        elRef.current?.setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activeRef.current) update(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className="absolute inset-0 rounded-full border-4 border-[#f5d87a]/40 bg-black/25 backdrop-blur-[1px]" />
      <div
        className="absolute rounded-full border-2 border-[#f5d87a] bg-[#f5d87a]/60 shadow-[0_0_12px_rgba(245,216,122,0.6)]"
        style={{
          width: KNOB,
          height: KNOB,
          left: RADIUS - KNOB / 2 + knob.x,
          top: RADIUS - KNOB / 2 + knob.y,
        }}
      />
    </div>
  );
}