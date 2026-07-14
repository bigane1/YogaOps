type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 28, className }: BrandLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#faf8f5" />
      <circle cx="16" cy="16" r="12" fill="#c9a0a0" />
      <path
        d="M10.5 10.5 L16 19.5 L21.5 10.5"
        fill="none"
        stroke="#faf8f5"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 19.5 L16 23.5"
        fill="none"
        stroke="#faf8f5"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
