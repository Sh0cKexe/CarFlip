export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none">
        <rect x="3" y="10" width="18" height="6" rx="2" fill="white" />
        <rect x="7" y="6" width="10" height="5" rx="1.5" fill="white" />
        <circle cx="8" cy="17" r="2.3" fill="white" />
        <circle cx="16" cy="17" r="2.3" fill="white" />
        <circle cx="8" cy="17" r="1" fill="#0f172a" />
        <circle cx="16" cy="17" r="1" fill="#0f172a" />
      </svg>
    </span>
  );
}
