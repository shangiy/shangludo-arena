import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <g fill="hsl(var(--primary))">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z" />
        <path d="M14.5 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </g>
      <text
        x="10"
        y="17"
        fontFamily="Inter, sans-serif"
        fontSize="8"
        fontWeight="bold"
        fill="hsl(var(--primary))"
        textAnchor="middle"
      >
        SL
      </text>
    </svg>
  );
}
