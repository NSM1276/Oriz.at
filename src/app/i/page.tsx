import { redirect } from "next/navigation";

// Short entry point for venue owners: oriz.at/i
// Easy to type on a phone and to print on the setup sheet. It lands on the
// normal admin, which sends the owner straight to their venue when logged in
// and to the login form when not.
export const dynamic = "force-dynamic";

export default function OwnerShortcut() {
  redirect("/admin");
}
