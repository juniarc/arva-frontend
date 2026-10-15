import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { NavbarUser } from "@/lib/navbar/navbar.types";
import { TRIGGER, type TriggerProps } from "./navbar-styles";

/** Guests: the default avatar and "Login", a link to the login page. Logged in: the avatar and the username. */
export function ProfileTrigger({ user, ...props }: { user: NavbarUser | null } & TriggerProps) {
  if (!user) {
    return (
      <Link href="/login" className={TRIGGER}>
        <Avatar src={null} name={null} size="sm" decorative />
        <span>Login</span>
      </Link>
    );
  }
  return (
    <button
      ref={props.triggerRef}
      type="button"
      aria-label={user.username ? `Account menu, ${user.username}` : "Account menu"}
      aria-expanded={props.open}
      aria-controls={props.panelId}
      onClick={props.onToggle}
      className={TRIGGER}
    >
      <Avatar src={user.photoUrl} name={user.username} size="sm" />
      <span className="max-w-32 truncate font-bold">{user.username ?? "My Profile"}</span>
    </button>
  );
}
