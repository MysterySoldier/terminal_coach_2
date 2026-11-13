import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PromptButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "solid" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Wrap the label in terminal-style brackets. */
  brackets?: boolean;
}

const VARIANTS: Record<NonNullable<PromptButtonProps["variant"]>, string> = {
  solid: "border-phosphor bg-phosphor/15 text-phosphor hover:bg-phosphor/25 hover:shadow-[0_0_20px_hsl(111_100%_54%/0.25)]",
  outline: "border-border bg-transparent text-foreground hover:border-phosphor/60 hover:text-phosphor",
  ghost: "border-transparent bg-transparent text-muted-foreground hover:text-phosphor",
  danger: "border-danger/60 bg-danger/10 text-danger hover:bg-danger/20",
};

const SIZES: Record<NonNullable<PromptButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

/** Terminal-prompt styled button: bracketed label, green underglow on press. */
export const PromptButton = forwardRef<HTMLButtonElement, PromptButtonProps>(function PromptButton(
  { children, className, variant = "solid", size = "md", brackets = false, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-mono font-medium tracking-tight",
        "transition-all duration-150 active:scale-[0.97] active:brightness-125",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {brackets ? (
        <span className="whitespace-nowrap">
          <span className="opacity-60">[</span> {children} <span className="opacity-60">]</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});
