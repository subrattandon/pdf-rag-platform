"use client";

import { ClerkProvider as ClerkProviderBase, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProviderBase publishableKey={publishableKey}>
      {children}
    </ClerkProviderBase>
  );
}

export function useClerkToken() {
  const { getToken, isSignedIn } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      getToken().then((t) => setToken(t));
    } else {
      setToken(null);
    }
  }, [isSignedIn, getToken]);

  return { token, isSignedIn };
}
