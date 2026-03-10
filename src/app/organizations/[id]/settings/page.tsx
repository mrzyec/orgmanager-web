import OrganizationSettingsPageClient from "./OrganizationSettingsPageClient";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrganizationSettingsPageClient id={id} />;
}