import OrganizationOverviewClient from "./OrganizationOverviewClient";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrganizationOverviewClient id={id} />;
}