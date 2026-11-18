"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  containerClassName?: string;
};

/** Floating-label input with icon, focus glow, error and hint. */
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, icon, error, hint, className, containerClassName, type = "text", id, ...props },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const [show, setShow] = React.useState(false);
  const isPassword = type === "password";
  const alwaysFloat = ["date", "datetime-local", "time", "month"].includes(type);
  return (
    <div className={cn("w-full", containerClassName)}>
      <div className={cn("field", icon && "field-has-icon")}>
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground [&>svg]:size-[1.1rem]">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && show ? "text" : type}
          placeholder=" "
          data-filled={alwaysFloat ? "true" : undefined}
          aria-invalid={!!error}
          className={cn(
            "field-input peer h-12 w-full rounded-xl border border-input bg-card px-4 pt-1 text-[0.95rem] text-foreground outline-none placeholder:text-transparent disabled:bg-muted disabled:text-muted-foreground",
            icon && "pl-10",
            isPassword && "pr-11",
            error && "border-danger focus:border-danger",
            className,
          )}
          {...props}
        />
        <label htmlFor={inputId} className="field-label">
          {label}
          {props.required && <span className="text-muted-foreground"> *</span>}
        </label>
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
});

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string; containerClassName?: string };

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, className, containerClassName, id, rows = 4, ...props },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("w-full", containerClassName)}>
      <div className="field">
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          placeholder=" "
          className={cn(
            "field-input field-textarea w-full resize-y rounded-xl border border-input bg-card px-4 pb-3 pt-5 text-[0.95rem] text-foreground outline-none placeholder:text-transparent",
            error && "border-danger",
            className,
          )}
          {...props}
        />
        <label htmlFor={inputId} className="field-label">
          {label}
          {props.required && <span className="text-muted-foreground"> *</span>}
        </label>
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; containerClassName?: string };

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, className, containerClassName, id, children, ...props },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("w-full", containerClassName)}>
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "field-input h-12 w-full appearance-none rounded-xl border border-input bg-card px-4 pt-4 text-[0.95rem] text-foreground outline-none",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <label htmlFor={inputId} className="pointer-events-none absolute left-4 top-1.5 text-[0.7rem] font-medium text-muted-foreground">
          {label}
        </label>
        <svg className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
});

/** Small plain label used above custom controls. */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mb-2 text-sm font-medium text-foreground", className)}>{children}</p>;
}
