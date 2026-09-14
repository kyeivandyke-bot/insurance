import { LucideIcon, Loader2 } from 'lucide-react';
import { tokens } from '../tokens';

interface ButtonProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabledReason?: string | null;
  id?: string;
}

export function Button({
  label,
  onClick,
  icon: Icon,
  variant = 'secondary',
  loading = false,
  disabledReason = null,
  id,
}: ButtonProps) {
  // Enforce rule: onClick is required. No handler, no render.
  if (!onClick) {
    return null;
  }

  const disabled = Boolean(disabledReason) || loading;

  const baseStyle =
    'min-h-11 px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors';

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary:
      'bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 active:bg-slate-200',
    danger:
      'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 active:bg-rose-100',
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        id={id}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${baseStyle} ${variantStyles[variant]} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {loading ? (
          <Loader2 size={tokens.icon} className="animate-spin" />
        ) : Icon ? (
          <Icon size={tokens.icon} />
        ) : null}
        <span>{label}</span>
      </button>
      {disabledReason && (
        <span className={tokens.text.helper}>{disabledReason}</span>
      )}
    </div>
  );
}
