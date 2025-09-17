type Props = {
  label: string;
  checked: boolean;
  onChange: () => void;
};
export default function Checkbox({ label, checked, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
