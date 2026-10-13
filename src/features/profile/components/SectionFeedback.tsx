import { Alert } from "@/components/ui/Alert";
import type { Notice } from "../state/profile-reducer";

/** The success or failure banner at the top of the card. The Alert gives it role="status" or role="alert". */
export function SectionFeedback({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  if (!notice) return null;
  return <Alert variant={notice.kind} message={notice.message} onClose={onClose} className="mb-4" />;
}
