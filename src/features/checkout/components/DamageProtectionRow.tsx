import { ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { formatCurrency } from "@/lib/format";

interface DamageProtectionRowProps {
  enabled: boolean;
  /** From the backend. */
  fee: number;
  pending: boolean;
  onChange: (enabled: boolean) => void;
}

/** The checkbox's name includes the fee, so a screen reader hears what the user would pay. */
export function DamageProtectionRow({ enabled, fee, pending, onChange }: DamageProtectionRowProps) {
  const feeText = formatCurrency(fee);

  return (
    <div className="flex items-center gap-2 border-t border-line/40 pt-2 text-xs">
      <ShieldCheck className="size-4 shrink-0 text-muted" aria-hidden="true" />
      {/* "Opens nothing for now", so it is plain underlined text, not a link. */}
      <span className="underline">Total damage protection 3 months</span>
      <span className="ml-auto text-muted">({feeText})</span>
      <Checkbox
        label={`Total damage protection 3 months (${feeText})`}
        checked={enabled}
        disabled={pending}
        onChange={() => onChange(!enabled)}
        className="-mr-2 lg:mr-0"
      />
    </div>
  );
}
