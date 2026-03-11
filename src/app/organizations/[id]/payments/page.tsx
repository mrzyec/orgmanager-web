import OrganizationPaymentsPageClient from "./payments-page-client";

/**
 * Payments route server component
 * - URL'den organization id alır
 * - Client component'e aktarır
 * - Mevcut app router yapısını bozmaz
 */
export default async function OrganizationPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrganizationPaymentsPageClient organizationId={id} />;
}