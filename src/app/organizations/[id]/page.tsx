import { use } from "react";
import OrganizationDetailsClient from "./OrganizationDetailsClient";

export default function OrganizationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <OrganizationDetailsClient id={id} />;
}