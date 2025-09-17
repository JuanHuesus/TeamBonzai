type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
};
export default function Modal({ open, onClose, children, title }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div className="max-w-3xl w-full rounded-2xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <div className="font-bold">{title}</div>
          <button className="rounded-xl px-3 py-1 border" onClick={onClose}>Sulje</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
