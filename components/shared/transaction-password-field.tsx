"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import {
  transactionPasswordErrorClass,
  transactionPasswordInputClass,
} from "@/lib/transaction-password";

interface TransactionPasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  placeholder?: string;
  error?: string | null;
  name?: string;
  inputWrapperClassName?: string;
  onValueChange?: () => void;
}

export function TransactionPasswordField({
  value,
  onChange,
  label,
  placeholder = "••••••••",
  error,
  name = "password",
  inputWrapperClassName = "relative flex h-10 items-center rounded-xl border border-zinc-200 bg-zinc-50 transition-all focus-within:border-brand-green focus-within:ring-4 focus-within:ring-brand-green/10 dark:border-border dark:bg-surface-secondary",
  onValueChange,
}: TransactionPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    onValueChange?.();
  };

  return (
    <div className="w-full">
      {label ? <div className="mb-1 ml-1">{label}</div> : null}
      <div className={transactionPasswordInputClass(Boolean(error), inputWrapperClassName)}>
        <input
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="current-password"
          className="w-full bg-transparent px-3 py-2 pr-14 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-2 my-auto flex h-7 min-w-[2.75rem] items-center justify-center rounded-md px-1 text-[10px] font-black uppercase tracking-wide text-brand-green/70 transition-colors hover:bg-brand-green/10 hover:text-brand-green dark:text-pawn-gold/80 dark:hover:bg-brand-green/20 dark:hover:text-pawn-gold"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <p className={transactionPasswordErrorClass}>{error}</p> : null}
    </div>
  );
}
