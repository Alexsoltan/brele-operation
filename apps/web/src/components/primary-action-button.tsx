import Link from "next/link";
import type { ReactNode } from "react";

type PrimaryActionButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function PrimaryActionButton({
  children,
  href,
  onClick,
  icon,
  type = "button",
  disabled = false,
}: PrimaryActionButtonProps) {
  const className =
    "inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300";

  if (href) {
    return (
      <Link href={href} className={className}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {icon}
      {children}
    </button>
  );
}