// src/lib/orgApi.ts
// Organizations endpointleri.
// Backend: /api/organizations (+ /{id}/active patch)

import { api } from "./apiClient";

export type OrganizationDto = {
  id: string;
  name: string;
  description?: string | null;
  taxNumber: string;
  city: string;
  district: string;
  isActive: boolean;
  createdAtUtc: string;
};

export type CreateOrganizationRequest = {
  name: string;
  taxNumber: string;
  city: string;
  district: string;
  description?: string | null;
};

export async function getOrganizations(accessToken: string) {
  return api<OrganizationDto[]>("/api/organizations", {
    method: "GET",
    token: accessToken,
  });
}

export async function createOrganization(accessToken: string, req: CreateOrganizationRequest) {
  return api<OrganizationDto>("/api/organizations", {
    method: "POST",
    token: accessToken,
    body: req,
  });
}

export async function setOrganizationActive(accessToken: string, id: string, isActive: boolean) {
  return api<void>(`/api/organizations/${id}/active`, {
    method: "PATCH",
    token: accessToken,
    body: { isActive },
  });
}