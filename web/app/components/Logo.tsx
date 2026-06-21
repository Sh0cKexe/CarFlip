/* eslint-disable @next/next/no-img-element */
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent2"
      style={{ width: size, height: size }}
    >
      <img src="/auto-logo-white.png" alt="" width={size * 0.78} height={size * 0.78} style={{ objectFit: "contain" }} />
    </span>
  );
}
