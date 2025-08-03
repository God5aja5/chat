import React, { ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useTheme(); // Initialize theme

  return <>{children}</>;
}
