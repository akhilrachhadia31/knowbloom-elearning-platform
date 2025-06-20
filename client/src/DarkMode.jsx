// DarkModeToggle.jsx
import React from "react";
import { useTheme } from "./components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

const themes = ["light", "dark"];
const getNextTheme = (current) =>
  themes[(themes.indexOf(current) + 1) % themes.length];

const useCurrentThemeClass = () => {
  const [current, setCurrent] = React.useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setCurrent(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return current;
};

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const actualTheme = useCurrentThemeClass();

  const handleToggle = () => {
    const nextTheme = getNextTheme(theme);
    setTheme(nextTheme);
  };

  return (
    <button
      onClick={handleToggle}
      aria-label="Toggle theme"
      className={`flex items-center justify-center w-7 h-7 rounded-full bg-transparent focus:outline-none relative`}
    >
      <Sun
        className={`absolute transition-all duration-300 h-4 w-4 text-yellow-500 ${
          actualTheme === "dark"
            ? "opacity-0 scale-75"
            : "opacity-100 scale-100"
        }`}
      />
      <Moon
        className={`absolute transition-all duration-300 h-4 w-4 text-indigo-400 ${
          actualTheme === "dark"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-75"
        }`}
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default DarkModeToggle;
