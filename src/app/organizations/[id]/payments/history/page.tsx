import OrganizationPaymentHistoryPageClient from "./OrganizationPaymentHistoryPageClient";

export default async function OrganizationPaymentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrganizationPaymentHistoryPageClient organizationId={id} />;
}