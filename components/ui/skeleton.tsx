export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-lg bg-black/[0.06] [animation:sg-pulse_1.6s_ease-in-out_infinite] ${className}`}
    />
  );
}
