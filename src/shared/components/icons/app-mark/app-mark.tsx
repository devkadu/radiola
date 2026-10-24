import type { SVGProps } from "react";

export function AppMark({ width = 18, height = 18, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M8 7l10 8-10 8V7z" fill="#0a0a0a" />
      <path d="M18 7l10 8-10 8V7z" fill="rgba(10,10,10,0.4)" />
    </svg>
  );
}
