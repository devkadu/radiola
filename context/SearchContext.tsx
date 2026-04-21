"use client";

import { createContext, useContext, useState } from "react";

const SearchContext = createContext<{
  isOpen: boolean;
  initialQuery: string;
  open: (query?: string) => void;
  close: () => void;
}>({ isOpen: false, initialQuery: "", open: () => {}, close: () => {} });

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  const open = (query = "") => {
    setInitialQuery(query);
    setIsOpen(true);
  };

  return (
    <SearchContext.Provider value={{ isOpen, initialQuery, open, close: () => setIsOpen(false) }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchOverlay = () => useContext(SearchContext);
