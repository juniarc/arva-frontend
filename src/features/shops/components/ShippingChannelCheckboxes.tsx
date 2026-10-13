import { Checkbox } from "@/components/ui/Checkbox";
import type { ShippingChannel } from "../types";

interface ShippingChannelCheckboxesProps {
  channels: ShippingChannel[];
  selectedIds: string[];
  error?: string;
  onChange: (ids: string[]) => void;
}

/** The shop can ship with several channels, so these are checkboxes (the design draws radio buttons). */
export function ShippingChannelCheckboxes({ channels, selectedIds, error, onChange }: ShippingChannelCheckboxesProps) {
  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((selected) => selected !== id) : [...selectedIds, id]);

  return (
    <fieldset aria-describedby={error ? "shop-channels-error" : undefined} className="m-0 min-w-0 border-0 py-2">
      <legend className="mb-1 p-0 text-xs text-muted">Shipping Channel</legend>
      <ul>
        {channels.map((channel) => (
          <li key={channel.id}>
            {/* The label makes the name clickable too. The checkbox already carries it as its accessible name. */}
            <label className="flex cursor-pointer items-center gap-1">
              <Checkbox label={channel.name} checked={selectedIds.includes(channel.id)} onChange={() => toggle(channel.id)} />
              <span aria-hidden="true" className="text-sm text-ink">
                {channel.name}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {error && (
        <p id="shop-channels-error" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
