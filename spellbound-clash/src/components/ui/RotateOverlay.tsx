import { useIsTouch, useIsPortrait } from "../../hooks/useIsTouch";

export default function RotateOverlay() {
  const isTouch = useIsTouch();
  const isPortrait = useIsPortrait();

  if (!isTouch || !isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0c0a1a] p-8 text-center">
      <div className="text-6xl mb-8 animate-bounce">🔄</div>
      <p className="font-pixel text-sm text-[#f5d87a] mb-4">กรุณาหมุนจอเป็นแนวนอน</p>
      <p className="font-pixel text-[10px] text-[#9a8f72]">Please rotate your device to landscape</p>
    </div>
  );
}