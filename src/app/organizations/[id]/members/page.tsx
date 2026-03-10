import OrganizationMembersPageClient from "./OrganizationMembersPageClient";

export default async function OrganizationMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrganizationMembersPageClient id={id} />;
}