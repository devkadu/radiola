"use client";
import { FaMagnifyingGlass } from "react-icons/fa6";

export const SearchBar = () => {
  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-3 bg-[#1e1e1e] border border-[var(--border-muted)] rounded-xl px-4 py-3">
        <FaMagnifyingGlass size={14} className="text-gray-500 shrink-0" />
        <input
          type="text"
          placeholder="Buscar série ou episódio..."
          className="bg-transparent text-sm text-gray-300 placeholder-gray-500 outline-none w-full"
        />
      </div>
    </div>
  );
};
