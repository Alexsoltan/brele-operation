import type { ReactNode } from "react";

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-heading text-[32px] font-semibold leading-tight tracking-[-0.035em] text-gray-950 md:text-[40px]">
      {children}
    </h1>
  );
}