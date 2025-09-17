type Props = {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};
export default function PillButton({ active, onClick, children }: Props) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm border transition ${
        active ? "bg-black text-white border-black" : "hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}
