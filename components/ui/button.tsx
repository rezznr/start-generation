import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

// Pill, uppercase, bold: the Star Generation call-to-action style.
const base =
  "inline-flex items-center justify-center gap-3 rounded-full font-bold uppercase tracking-wide whitespace-nowrap " +
  "transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 " +
  "aria-busy:pointer-events-none";

const variants = {
  primary: "bg-gold text-navy hover:bg-gold-hover",
  secondary: "bg-navy text-white hover:bg-navy-hover",
  outline: "border-2 border-navy bg-transparent text-navy hover:bg-navy hover:text-white",
  outlineOnDark: "border-2 border-gold bg-transparent text-gold hover:bg-gold hover:text-navy",
  ghost: "bg-transparent text-navy hover:bg-navy/10",
  soft: "bg-gold-soft text-navy hover:bg-gold",
  danger: "bg-destructive text-white hover:brightness-95",
} as const;

const sizes = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-8 text-base",
  lg: "h-14 px-10 text-lg",
} as const;

type Props = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  /** Trailing arrow in a navy circle, as on "Enroll Now" and "Contact Us". */
  arrow?: boolean;
  /** Rounded rectangle instead of a pill, for form submit buttons. */
  square?: boolean;
  href?: string;
} & Omit<ComponentProps<"button">, "ref">;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  arrow = false,
  square = false,
  href,
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  const cls = `${base} ${square ? "!rounded-card" : ""} ${variants[variant]} ${sizes[size]} ${className}`;
  const content = (
    <>
      {loading && <Loader2 className="size-5 animate-spin" aria-hidden />}
      {children}
      {arrow && !loading && (
        <span className="grid size-7 place-items-center rounded-full bg-navy text-white" aria-hidden>
          <ArrowRight className="size-4" />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button
      {...rest}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}
