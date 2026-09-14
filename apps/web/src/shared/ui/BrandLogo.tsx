export function BrandLogo({
  onNavigate,
  className = "",
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={`flex min-w-0 items-center gap-sm sm:gap-md text-left transition-opacity ${onNavigate ? "cursor-pointer hover:opacity-85" : ""} ${className}`}
      aria-label="CooCoo 煮煮 首頁"
    >
      <svg
        className="h-7 w-7 shrink-0 text-primary transition-transform sm:h-8 sm:w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
        <line className="chef-eyes" x1="9" y1="12" x2="9.01" y2="12" />
        <line className="chef-eyes" x1="15" y1="12" x2="15.01" y2="12" />
        <line x1="6" y1="17" x2="18" y2="17" />
      </svg>
      <h1 className="whitespace-nowrap text-base font-extrabold tracking-wide text-primary sm:text-xl">
        CooCoo 煮煮
      </h1>
    </button>
  );
}
