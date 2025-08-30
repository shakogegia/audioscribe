"use client";
import { useTheme } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { SWRConfig } from "swr";

export default function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const { theme } = useTheme();

  return (
    <>
      <NuqsAdapter>
        <SWRConfig
          value={{
            refreshInterval: 3000,
            fetcher: (resource, init) => fetch(resource, init).then(res => res.json()),
          }}
        >
          {children}
        </SWRConfig>
      </NuqsAdapter>
      <Toaster position="bottom-center" theme={theme as "light" | "dark"} duration={1000} />
    </>
  );
}
