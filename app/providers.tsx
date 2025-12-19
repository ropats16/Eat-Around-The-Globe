"use client";

import { ReactNode, useEffect } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Initialize AppKit only on the client side
    import("@/lib/appkit-config").catch((error) => {
      console.error("Failed to initialize AppKit:", error);
    });
  }, []);

  // Render children immediately - AppKit will initialize in the background
  return <>{children}</>;
}
