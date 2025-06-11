import React from "react";

interface Web3CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "crypto" | "glass" | "minimal";
  glow?: boolean;
  hover?: boolean;
}

const Web3Card: React.FC<Web3CardProps> = ({
  children,
  className = "",
  variant = "default",
  glow = false,
  hover = true,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "crypto":
        return `
          bg-gradient-to-br from-slate-900/90 to-purple-900/20 
          border border-purple-500/30 
          ${glow ? "shadow-crypto-glow" : ""}
        `;
      case "glass":
        return `
          bg-slate-800/30 
          backdrop-blur-md 
          border border-slate-700/50
          ${glow ? "shadow-lg shadow-purple-500/10" : ""}
        `;
      case "minimal":
        return `
          bg-slate-900 
          border border-slate-800
        `;
      default:
        return `
          bg-slate-800/50 
          border border-slate-700/50 
          backdrop-blur-sm
          ${glow ? "shadow-lg shadow-slate-900/50" : ""}
        `;
    }
  };

  const getHoverStyles = () => {
    if (!hover) return "";

    switch (variant) {
      case "crypto":
        return "hover:border-purple-400/50 hover:shadow-purple-500/30 transition-all duration-300";
      case "glass":
        return "hover:bg-slate-800/40 hover:border-slate-600/60 transition-all duration-300";
      default:
        return "hover:border-slate-600/60 hover:bg-slate-800/60 transition-all duration-300";
    }
  };

  return (
    <div
      className={`
        rounded-xl p-6
        ${getVariantStyles()}
        ${getHoverStyles()}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Web3Card;
