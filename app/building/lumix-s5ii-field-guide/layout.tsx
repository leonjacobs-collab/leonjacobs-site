import type { ReactNode } from "react";
import { FieldGuideMast } from "./components/FieldGuideMast";
import { FieldGuideNav } from "./components/FieldGuideNav";

export default function FieldGuideLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FieldGuideMast />
      <FieldGuideNav />
      {children}
    </>
  );
}
