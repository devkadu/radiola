import { FaMagnifyingGlass } from "react-icons/fa6";

export const Header = () => {
  return (
    <header className="border p-4 flex justify-between items-center">
      <h1 className="font-bold text-2xl">Radiola</h1>
      <FaMagnifyingGlass size={20} />
    </header>
  );
};
