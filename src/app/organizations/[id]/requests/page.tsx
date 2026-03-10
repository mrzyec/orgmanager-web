import OrganizationRequestsPageClient from "./OrganizationRequestsPageClient";

export default async function OrganizationRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrganizationRequestsPageClient id={id} />;
}