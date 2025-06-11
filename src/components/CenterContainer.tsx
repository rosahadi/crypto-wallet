import React from "react";

interface CenterContainerProps {
  children: React.ReactNode;
  className?: string;
  showBackground?: boolean;
  variant?: "default" | "crypto" | "minimal";
}

const CenterContainer: React.FC<CenterContainerProps> = ({
  children,
  className = "",
  showBackground = true,
  variant = "default",
}) => {
  const getBackgroundClass = () => {
    if (!showBackground) return "";

    switch (variant) {
      case "crypto":
        return "bg-gradient-to-br from-slate-950 via-purple-950/20 to-blue-950/20";
      case "minimal":
        return "bg-slate-950";
      default:
        return "bg-gradient-to-br from-slate-950 to-slate-900";
    }
  };

  const getOverlayPattern = () => {
    if (variant === "minimal") return null;

    return (
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>
    );
  };

  return (
    <div
      className={`
        min-h-screen 
        flex 
        items-center 
        justify-center 
        p-4 
        relative
        ${getBackgroundClass()}
        ${className}
      `}
    >
      {getOverlayPattern()}

      {/* Animated background elements */}
      {variant === "crypto" && (
        <>
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float" />
          <div
            className="absolute bottom-20 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-float"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-10 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl animate-float"
            style={{ animationDelay: "2s" }}
          />
        </>
      )}

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export default CenterContainer;
