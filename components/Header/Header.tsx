import { FaMagnifyingGlass } from "react-icons/fa6";

export const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 text-white">
      <h1>Radiola</h1>
      <FaMagnifyingGlass size={20} />
    </header>
  );
};
