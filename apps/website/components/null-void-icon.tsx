export function NullVoidIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer eye / lens shape */}
      <path
        d="M2 12Q12 4 22 12Q12 20 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Iris */}
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      {/* Pupil — the void */}
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
