import { createContext, useContext, useEffect, useState } from "react";
import type {ReactNode} from 'react';

// 1️ Define the shape of the context
interface ThemeContextType {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

// 2️ Define props for the provider
interface ThemeProviderProps {
  children: ReactNode;
}

// 3️ Create the context with proper type
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 4️ ThemeProvider component
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 5️ Custom hook to use the theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
