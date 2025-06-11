import React from "react";
import {
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";

interface StatusMessageProps {
  type: "loading" | "success" | "error" | "info";
  message: string;
  submessage?: string;
  icon?: React.ReactNode;
  className?: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  message,
  submessage,
  icon,
  className = "",
}) => {
  const getIcon = () => {
    if (icon) return icon;

    switch (type) {
      case "loading":
        return <Loader2 className="w-6 h-6 animate-spin" />;
      case "success":
        return <CheckCircle className="w-6 h-6" />;
      case "error":
        return <AlertCircle className="w-6 h-6" />;
      case "info":
        return <Info className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "loading":
        return {
          container:
            "bg-slate-800/50 border-purple-500/30 shadow-crypto-glow",
          icon: "text-purple-400",
          text: "text-slate-200",
          subtext: "text-slate-400",
        };
      case "success":
        return {
          container:
            "bg-emerald-900/20 border-emerald-500/30 shadow-cyan-glow",
          icon: "text-emerald-400",
          text: "text-slate-200",
          subtext: "text-slate-400",
        };
      case "error":
        return {
          container: "bg-red-900/20 border-red-500/30",
          icon: "text-red-400",
          text: "text-slate-200",
          subtext: "text-slate-400",
        };
      case "info":
        return {
          container: "bg-blue-900/20 border-blue-500/30",
          icon: "text-blue-400",
          text: "text-slate-200",
          subtext: "text-slate-400",
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`
        flex items-center justify-center p-6 
        rounded-xl border backdrop-blur-sm
        ${styles.container}
        ${className}
      `}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`${styles.icon} animate-pulse`}>
          {getIcon()}
        </div>

        <div className="space-y-1">
          <p className={`font-medium ${styles.text}`}>
            {message}
          </p>

          {submessage && (
            <p className={`text-sm ${styles.subtext}`}>
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusMessage;
