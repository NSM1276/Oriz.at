import { notFound } from "next/navigation";
import { requireUser, requireVenue } from "../../../venue";
import { isServiceKind } from "@/lib/services";
import { OrderForm } from "./OrderForm";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ art?: string }>;
}) {
  const { slug } = await params;
  const { art } = await searchParams;
  if (!isServiceKind(art)) notFound();
  const { venue } = await requireVenue(slug);
  const user = await requireUser(`/app/${slug}/leistungen/neu?art=${art}`);
  return <OrderForm slug={venue.slug} kind={art} email={user.email ?? ""} />;
}
