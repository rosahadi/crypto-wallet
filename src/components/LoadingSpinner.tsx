import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  variant?: "default" | "crypto" | "success";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  message = "Loading...",
  variant = "default",
}) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const containerClasses = {
    sm: "gap-2 text-sm",
    md: "gap-3 text-base",
    lg: "gap-4 text-lg",
    xl: "gap-5 text-xl",
  };

  const getSpinnerStyle = () => {
    switch (variant) {
      case "crypto":
        return "border-purple-500/30 border-t-purple-500";
      case "success":
        return "border-emerald-500/30 border-t-emerald-500";
      default:
        return "border-slate-700 border-t-slate-400";
    }
  };

  const getGlowEffect = () => {
    switch (variant) {
      case "crypto":
        return "shadow-crypto-glow";
      case "success":
        return "shadow-cyan-glow";
      default:
        return "";
    }
  };

  return (
    <div
      className={`flex items-center justify-center ${containerClasses[size]}`}
    >
      <div className="relative">
        {/* Outer ring */}
        <div
          className={`
            ${sizeClasses[size]} 
            border-4 
            ${getSpinnerStyle()} 
            rounded-full 
            animate-spin
            ${getGlowEffect()}
          `}
        />

        {/* Inner dot */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full 
                     animate-pulse"
        />
      </div>

      {message && (
        <span className="text-slate-300 font-medium animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
