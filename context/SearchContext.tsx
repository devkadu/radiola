"use client";

import { createContext, useContext, useState } from "react";

const SearchContext = createContext<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
}>({ isOpen: false, open: () => {}, close: () => {} });

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SearchContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchOverlay = () => useContext(SearchContext);
