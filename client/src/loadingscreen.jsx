import React from "react";
import Logo from "./components/Logo.jsx";

export default function LoadingScreen() {
  return (
    <div
      className="
        fixed inset-0           
        flex items-center 
        justify-center         
        bg-gradient-to-br from-slate-50 via-white to-blue-50
        dark:from-gray-900 dark:via-black dark:to-blue-950
        z-50                    
      "
    >
      <div className="flex flex-col items-center gap-4">
        {/* Simple centered logo with subtle background */}
        <div
          className="
            p-6 
            bg-white/80 dark:bg-gray-800/80   
            rounded-full 
            shadow-lg 
            border border-white/30 dark:border-gray-700/30
          "
        >
          <Logo size="lg" showText={false} />
        </div>

        {/* Simple loading text */}
        <span
          className="
            text-xl 
            font-medium 
            text-gray-700 dark:text-gray-200
          "
        >
          Loading…
        </span>

        {/* Simple progress dots */}
        <div className="flex gap-1">
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
