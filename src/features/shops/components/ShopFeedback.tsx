import { Alert } from "@/components/ui/Alert";

export interface ShopNotice {
  kind: "success" | "error";
  message: string;
}

/** The success or failure banner at the top of the form. The Alert gives it role="status" or role="alert". */
export function ShopFeedback({ notice, onClose }: { notice: ShopNotice | null; onClose: () => void }) {
  if (!notice) return null;
  return <Alert variant={notice.kind} message={notice.message} onClose={onClose} className="mb-4" />;
}
