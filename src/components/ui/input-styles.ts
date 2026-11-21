/**
 * The one look of a form control: 44 px high, 16 px text, visible focus ring. Border colour is added by the
 * user of `controlBase` (normal or error); `inputStyles` is the normal one.
 */
export const controlBase =
  "h-11 w-full rounded-md border bg-surface px-3 text-base text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong";

export const inputStyles = `${controlBase} border-border`;
