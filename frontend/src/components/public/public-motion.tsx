export function PublicMotionStyles() {
  return (
    <style>{`
      @keyframes em-float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      @keyframes em-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes em-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      @keyframes em-drift { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-20px); } }
      @keyframes em-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      .em-in { animation: em-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
      @media (prefers-reduced-motion: reduce) {
        [style*="animation"], .em-in { animation: none !important; }
      }
    `}</style>
  );
}

export function PublicAmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute -left-32 top-[-10%] h-[420px] w-[420px] rounded-full bg-primary/10 blur-[100px]"
        style={{ animation: "em-drift 14s ease-in-out infinite" }}
      />
      <div
        className="absolute right-[-10%] top-[20%] h-[380px] w-[380px] rounded-full bg-secondary/40 blur-[100px]"
        style={{ animation: "em-drift 18s ease-in-out infinite reverse" }}
      />
      <div
        className="absolute bottom-[-5%] left-[30%] h-[300px] w-[300px] rounded-full bg-accent/30 blur-[90px]"
        style={{ animation: "em-drift 20s ease-in-out infinite" }}
      />
    </div>
  );
}
