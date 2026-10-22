import { requireUser, requireVenue } from "../../venue";
import { AccountForms } from "./AccountForms";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venueCount } = await requireVenue(slug);
  const user = await requireUser(`/app/${slug}/konto`);
  return <AccountForms email={user.email ?? ""} showVenues={venueCount > 1} />;
}
