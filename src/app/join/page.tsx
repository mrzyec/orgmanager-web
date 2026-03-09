"use client";

import { useEffect, useState } from "react";
import {
  AppButton,
  AppCard,
  AppHero,
  AppLinkButton,
  AppPage,
} from "@/components/ui";
import { AppField, AppInput } from "@/components/form-ui";
import { useToast } from "@/components/ToastProvider";
import {
  cancelOrganizationJoinRequest,
  createOrganizationJoinRequest,
  getAccessToken,
  getMyOrganizationJoinRequests,
  type OrganizationJoinRequestDto,
} from "@/lib/api";
import { MyJoinRequestsList } from "@/components/join-ui";

export default function JoinPage() {
  const { showToast } = useToast();

  const [joinCode, setJoinCode] = useState("");
  const [requests, setRequests] = useState<OrganizationJoinRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadMyRequests() {
    try {
      const data = await getMyOrganizationJoinRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getAccessToken()) return;
    loadMyRequests();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!joinCode.trim()) {
      showToast({
        message: "Lütfen geçerli bir katılım kodu gir.",
        type: "error",
      });
      return;
    }

    setActionLoading(true);

    try {
      await createOrganizationJoinRequest(joinCode.trim().toUpperCase());
      setJoinCode("");
      await loadMyRequests();

      showToast({
        message: "Katılım talebin gönderildi. Owner onayı bekleniyor.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Katılım talebi gönderilemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelRequest(request: OrganizationJoinRequestDto) {
    if (request.status !== "Pending") return;

    const confirmed = window.confirm(
      `${request.organizationName} için gönderdiğin başvuruyu geri çekmek istiyor musun?`
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      await cancelOrganizationJoinRequest(request.id);
      setRequests((prev) => prev.filter((x) => x.id !== request.id));

      showToast({
        message: "Başvurun başarıyla geri çekildi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Başvuru geri çekilemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppPage>
      <AppHero
        badge="Katılım"
        title="Katılım kodu ile başvur"
        description="Owner tarafından verilen kod ile organizasyona başvuru gönderebilirsin."
        right={<AppLinkButton href="/dashboard">Dashboard</AppLinkButton>}
      />

      <AppCard>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <AppField label="Katılım kodu" className="flex-1">
            <AppInput
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Örn: ORG-ABC123"
            />
          </AppField>

          <AppButton type="submit" tone="primary" disabled={actionLoading}>
            {actionLoading ? "Gönderiliyor..." : "Başvuru gönder"}
          </AppButton>
        </form>
      </AppCard>

      <MyJoinRequestsList
        requests={requests}
        loading={loading}
        actionLoading={actionLoading}
        onCancel={handleCancelRequest}
      />
    </AppPage>
  );
}