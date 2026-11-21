import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Touch targets are at least 44 px high (docs: PRODUCT.md, accessibility). */
export const buttonStyles = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-base font-medium whitespace-nowrap outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary-strong disabled:cursor-not-allowed disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "border-primary-strong bg-primary-strong text-white hover:bg-[#00645d]",
        secondary: "border-border bg-surface text-foreground hover:bg-surface-muted",
        dark: "border-dark bg-dark text-white hover:bg-[#1d293d]",
        dog: "border-dog bg-dog text-white hover:bg-[#e68a00]",
        cat: "border-cat bg-cat text-white hover:bg-[#8610dc]",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-surface-muted",
        danger: "border-red-700 bg-red-700 text-white hover:bg-red-800",
      },
      size: {
        md: "",
        icon: "w-11 px-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, type = "button", ...props }: Props) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
