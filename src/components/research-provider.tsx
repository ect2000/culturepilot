"use client";
import { createContext, useContext, useRef } from "react";
import { saveBrief, readBrief } from "@/lib/storage";
import type { Brief } from "@/lib/types";
interface Session {
  create(brief: Brief): string;
  get(id: string): Brief | undefined;
}
const Context = createContext<Session | null>(null);
export function ResearchProvider({ children }: { children: React.ReactNode }) {
  const sessions = useRef(new Map<string, Brief>());
  return (
    <Context.Provider
      value={{
        create(brief) {
          const id = crypto.randomUUID();
          sessions.current.set(id, brief);
          saveBrief(id, brief);
          return id;
        },
        get(id) {
          return sessions.current.get(id) ?? readBrief(id);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useResearchSession() {
  const context = useContext(Context);
  if (!context) throw new Error("Research session is unavailable.");
  return context;
}
