"use client";

import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  AlertTriangle,
  X,
  Info,
  AlertCircle,
} from "lucide-react";

interface AlertProps {
  message: string;
  variant?: "error" | "warning" | "info";
  dismissible?: boolean;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  message,
  variant = "error",
  dismissible = true,
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  }, [setIsAnimating, setIsVisible, onDismiss]);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, handleDismiss]);

  const getVariantStyles = () => {
    switch (variant) {
      case "error":
        return {
          background:
            "bg-gradient-to-r from-red-900/20 to-red-800/20",
          border: "border-red-500/30",
          glow: "shadow-lg shadow-red-500/10",
          iconColor: "text-red-400",
          textColor: "text-red-200",
        };
      case "warning":
        return {
          background:
            "bg-gradient-to-r from-amber-900/20 to-orange-800/20",
          border: "border-amber-500/30",
          glow: "shadow-lg shadow-amber-500/10",
          iconColor: "text-amber-400",
          textColor: "text-amber-200",
        };
      case "info":
        return {
          background:
            "bg-gradient-to-r from-blue-900/20 to-cyan-800/20",
          border: "border-blue-500/30",
          glow: "shadow-lg shadow-blue-500/10",
          iconColor: "text-blue-400",
          textColor: "text-blue-200",
        };
      default:
        return {
          background:
            "bg-gradient-to-r from-red-900/20 to-red-800/20",
          border: "border-red-500/30",
          glow: "shadow-lg shadow-red-500/10",
          iconColor: "text-red-400",
          textColor: "text-red-200",
        };
    }
  };

  const getIcon = () => {
    switch (variant) {
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const styles = getVariantStyles();

  if (!isVisible) return null;

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl p-4 backdrop-blur-sm
        ${styles.background}
        ${styles.border}
        ${styles.glow}
        border transition-all duration-300 ease-out
        ${
          isAnimating
            ? "opacity-0 transform scale-95 translate-y-2"
            : "opacity-100 transform scale-100 translate-y-0"
        }
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full animate-pulse"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 ${styles.iconColor} animate-pulse`}
        >
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${styles.textColor} leading-relaxed`}
          >
            {message}
          </p>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0 p-1 rounded-md transition-all duration-200
              ${styles.iconColor} hover:bg-white/10 hover:scale-110
              focus:outline-none focus:ring-2 focus:ring-white/20
            `}
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar for auto-hide */}
      {autoHide && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
          <div
            className={`h-full ${styles.iconColor.replace(
              "text-",
              "bg-"
            )} animate-pulse`}
            style={{
              animation: `shrink ${autoHideDelay}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default Alert;
