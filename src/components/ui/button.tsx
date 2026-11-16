"use client";

import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "btn-3d inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
  {
    variants: {
      variant: {
        primary: "btn-depth-brand bg-gradient-to-b from-brand-500 to-brand-600 text-white",
        accent: "btn-depth-ember bg-gradient-to-b from-ember-400 to-ember-500 text-white",
        danger: "btn-depth-danger bg-gradient-to-b from-red-500 to-red-600 text-white",
        success: "btn-depth-success bg-gradient-to-b from-emerald-500 to-emerald-600 text-white",
        secondary: "btn-depth-soft border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground [&]:before:hidden",
        glass: "border border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
        link: "text-primary underline-offset-4 hover:underline [&]:before:hidden",
      },
      size: {
        sm: "h-9 rounded-xl px-3.5 text-sm",
        md: "h-11 rounded-xl px-5 text-[0.95rem]",
        lg: "h-13 rounded-2xl px-7 text-base",
        xl: "h-15 rounded-2xl px-8 text-lg",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { loading?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, disabled, children, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

type ButtonLinkProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants> & { external?: boolean };

export function ButtonLink({ className, variant, size, external, ...props }: ButtonLinkProps) {
  if (external) {
    const { href, ...rest } = props;
    return (
      <a
        href={String(href)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant, size }), className)}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
