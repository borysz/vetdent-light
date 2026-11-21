/** Small stylised illustrations (drawn for this app) of a dog's and a cat's head, in the species colours. */

const eye = "var(--foreground)";

export function DogArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <path d="M15 19c-7 2-10 13-7 23 2 6 9 7 12 2 2-4 1-14-1-20-1-3-2-5-4-5z" fill="var(--dog)" />
      <path d="M49 19c7 2 10 13 7 23-2 6-9 7-12 2-2-4-1-14 1-20 1-3 2-5 4-5z" fill="var(--dog)" />
      <ellipse cx="32" cy="34" rx="17" ry="19" fill="#fff" stroke="var(--dog-ink)" strokeWidth="2.5" />
      <ellipse cx="32" cy="43" rx="9" ry="7" fill="var(--dog-soft)" />
      <circle cx="25" cy="30" r="2.4" fill={eye} />
      <circle cx="39" cy="30" r="2.4" fill={eye} />
      <path d="M28.5 38.5h7l-3.5 4.5z" fill={eye} />
      <path d="M32 43v3.5M27.5 47.5c2 2 7 2 9 0" fill="none" stroke={eye} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CatArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <path d="M13 31L12 8l18 10z" fill="var(--cat)" />
      <path d="M51 31L52 8 34 18z" fill="var(--cat)" />
      <path d="M17 24l-.8-9.5 7.5 4.5z" fill="var(--cat-soft)" />
      <path d="M47 24l.8-9.5-7.5 4.5z" fill="var(--cat-soft)" />
      <ellipse cx="32" cy="37" rx="20" ry="17" fill="#fff" stroke="var(--cat-ink)" strokeWidth="2.5" />
      <ellipse cx="24.5" cy="34" rx="2.4" ry="3.2" fill={eye} />
      <ellipse cx="39.5" cy="34" rx="2.4" ry="3.2" fill={eye} />
      <path d="M29.5 41h5l-2.5 3z" fill="var(--cat)" />
      <path d="M32 44v2.5M28 48c1.7 1.4 2.8 1.2 4-.6 1.2 1.8 2.3 2 4 .6" fill="none" stroke={eye} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19 42.5l-9-2M19 46l-9 2M45 42.5l9-2M45 46l9 2" fill="none" stroke="var(--cat-ink)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
