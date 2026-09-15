import type { FieldValues } from "react-hook-form"
import { CircleCheckIcon, CircleOffIcon } from "lucide-react"
import { Badge } from "@components/ui/badge"
import { DropdownMenuItem } from "@components/ui/dropdown-menu"
import type { RecordMenuContext } from "./SettingsRecordEditor"
import _ from "@lib/translate"

type Enabled = { enabled?: 0 | 1 }

/**
 * Enable/Disable item for SettingsRecordEditor's menu slot.
 * This item owns the `enabled` field. The form must not render its own control for it,
 * or a stale edit would survive the post-toggle reset and the next Save would undo the toggle.
 */
export const EnabledMenuItem = <T extends FieldValues & Enabled>({ doc, loading, update }: RecordMenuContext<T>) => {
    const isEnabled = Boolean(doc.enabled)
    const toggle = () => update({ enabled: isEnabled ? 0 : 1 } as Partial<T>, isEnabled ? _("Disabled") : _("Enabled"))
    return (
        <DropdownMenuItem onClick={toggle} disabled={loading}>
            {isEnabled ? <CircleOffIcon /> : <CircleCheckIcon />}
            {isEnabled ? _("Disable") : _("Enable")}
        </DropdownMenuItem>
    )
}

/** Enabled/Disabled status badge for SettingsRecordEditor's badge slot. */
export const EnabledBadge = ({ doc }: { doc: Enabled }) => (
    <Badge variant="subtle" theme={doc.enabled ? "green" : "gray"}>
        {doc.enabled ? _("Enabled") : _("Disabled")}
    </Badge>
)
