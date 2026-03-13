import OrganizationPaymentsPageClient from "./OrganizationPaymentsPageClient";

export default async function OrganizationPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrganizationPaymentsPageClient organizationId={id} />;
}