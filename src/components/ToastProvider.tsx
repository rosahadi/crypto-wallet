"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      theme="dark"
      toastOptions={{
        style: {
          background: "#0f172a",
          border: "1px solid #334155",
          color: "#f1f5f9",
        },
        className: "my-toast",
        duration: 4000,
      }}
    />
  );
}
