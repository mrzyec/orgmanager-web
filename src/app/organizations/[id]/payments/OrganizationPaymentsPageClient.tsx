"use client";

import { useMemo } from "react";
import { useToast } from "@/components/ToastProvider";
import ActionConfirmModal from "@/components/ActionConfirmModal";
import { AppCard, AppLinkButton, AppPage } from "@/components/ui";
import { AppNavbar } from "@/components/app-navbar";
import { useOrganizationPageData } from "@/hooks/use-organization-page-data";
import PaymentDashboardHeroCard from "./_payments-components/payment-dashboard-hero-card";
import PaymentMembersSection from "./_payments-components/payment-members-section";
import PaymentSidePanels from "./_payments-components/payment-side-panels";
import PaymentStatCard from "./_payments-components/payment-stat-card";
import PaymentSettingsPanel from "./_payments-components/payment-settings-panel";
import {
  formatCurrency,
  getPaymentCancellationReasonOptions,
} from "./_payments-lib/payment-formatters";
import { useOrganizationPaymentsPage } from "./_payments-hooks/use-organization-payments-page";

export default function OrganizationPaymentsPageClient({
  organizationId,
}: {
  organizationId: string;
}) {
  const { showToast } = useToast();

  const { org, me } = useOrganizationPageData(organizationId);

  const vm = useOrganizationPaymentsPage({
    organizationId,
    showToast,
  });

  const cancellationReasonOptions = getPaymentCancellationReasonOptions();

  const isPaymentCancelConfirmDisabled =
    !vm.paymentCancelReasonCode ||
    (vm.paymentCancelReasonCode === "Other" &&
      vm.paymentCancelNote.trim().length === 0);

  const stats = useMemo(
    () => [
      {
        title: "Aidat Sistemi",
        value: vm.getCollectionTypeLabel(vm.collectionType),
        subtitle: `Aktif dönem: ${vm.activePeriodLabel}`,
        accentTone: "primary" as const,
        badge: vm.isSettingsPanelOpen
          ? "Ayarlar açık"
          : vm.settings?.isEnabled
          ? "Açık"
          : "Kapalı",
        onClick: () => vm.setIsSettingsPanelOpen((prev) => !prev),
        isActive: vm.isSettingsPanelOpen,
      },
      {
        title: "Ödeme Beklenen Üye",
        value: String(vm.members.length),
        subtitle: `Hiç ödeme yapmayan: ${vm.neverPaidCount}`,
        accentTone: "info" as const,
      },
      {
        title: "Tam Ödeyen",
        value: String(vm.paidCount),
        subtitle: `Tahsilat oranı: %${vm.collectionRate.toFixed(0)}`,
        accentTone: "success" as const,
      },
      {
        title: "Kısmi Ödeyen",
        value: String(vm.partialCount),
        subtitle: "Bu döneme ait eksik ödeme var",
        accentTone: "warning" as const,
      },
      {
        title: "Geciken Üye",
        value: String(vm.overdueCount),
        subtitle: "Açık geçmiş dönem borcu bulunuyor",
        accentTone: "danger" as const,
      },
      {
        title: "Kalan Alacak",
        value: formatCurrency(vm.totalRemainingAmount, vm.activeCurrency),
        subtitle: `Bekleyen: ${String(vm.unpaidCount)}`,
        accentTone: "muted" as const,
      },
    ],
    [vm]
  );

  return (
    <AppPage>
      <AppNavbar
        email={me?.email}
        title={org?.name ?? "Aidat ve ödemeler"}
        subtitle="Aidat planlarını, üye ödeme durumlarını ve son tahsilat hareketlerini buradan yönetebilirsin."
        actions={<AppLinkButton href={`/organizations/${organizationId}`}>Organizasyon dashboardına dön</AppLinkButton>}
      />

      <ActionConfirmModal
        open={vm.pendingPayment != null}
        title="Ödeme Onayı"
        description={
          vm.pendingPayment
            ? `${vm.pendingPayment.memberDisplayName} için ${vm.pendingPayment.periodLabel} dönemine ${formatCurrency(
                vm.pendingPayment.amount,
                vm.pendingPayment.currency
              )} ödeme kaydı oluşturulacak.`
            : ""
        }
        warningText="Bu işlem ödeme geçmişine yansıyacaktır. Devam etmek istediğine emin misin?"
        confirmText="Ödemeyi Onayla"
        cancelText="Vazgeç"
        confirmTone="default"
        isSubmitting={
          vm.pendingPayment != null && vm.payingPeriodId === vm.pendingPayment.periodId
        }
        onCancel={() => vm.setPendingPayment(null)}
        onConfirm={vm.confirmPayment}
      />

      <ActionConfirmModal
        open={vm.pendingPlanDelete != null}
        title="Aidat Planı İşlemi"
        description={
          vm.pendingPlanDelete
            ? `${vm.pendingPlanDelete.year} ${
                vm.pendingPlanDelete.period === "Yearly" ? "yıllık" : "aylık"
              } aidat planı için işlem seçiyorsun.`
            : ""
        }
        warningText={
          vm.planDeleteMode === "rollback"
            ? "Toplu geri al ve sil seçeneği bu plana bağlı tamamlanmış ödeme kayıtlarını iptal eder, açıklama ile birlikte geçmişe işler ve ardından planı siler."
            : "Normal silme yalnızca tamamlanmış ödeme kaydı yoksa çalışır. Tamamlanmış ödeme varsa toplu geri al ve sil kullanmalısın."
        }
        confirmText={
          vm.planDeleteMode === "rollback" ? "Toplu Geri Al ve Sil" : "Planı Sil"
        }
        cancelText="Vazgeç"
        confirmTone="danger"
        confirmDisabled={
          vm.planDeleteMode === "rollback" && vm.planDeleteNote.trim().length === 0
        }
        isSubmitting={
          vm.pendingPlanDelete != null &&
          vm.deletingPlanYear === vm.pendingPlanDelete.year
        }
        onCancel={() => vm.setPendingPlanDelete(null)}
        onConfirm={vm.confirmDeletePlan}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            İşlem türü
          </label>
          <select
            value={vm.planDeleteMode}
            onChange={(e) =>
              vm.setPlanDeleteMode(e.target.value as "delete" | "rollback")
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="delete">Sadece planı sil</option>
            <option value="rollback">Toplu geri al ve sil</option>
          </select>
        </div>

        {vm.planDeleteMode === "rollback" ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Toplu iptal sebebi
              </label>
              <select
                value={vm.planDeleteReasonCode}
                onChange={(e) =>
                  vm.setPlanDeleteReasonCode(
                    e.target.value as typeof vm.planDeleteReasonCode
                  )
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none"
              >
                {cancellationReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Açıklama
              </label>
              <textarea
                value={vm.planDeleteNote}
                onChange={(e) => vm.setPlanDeleteNote(e.target.value)}
                rows={4}
                placeholder="Örn: 2026 planı hatalı oluşturulduğu için tüm tahsilatlar toplu geri alınarak plan siliniyor."
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none"
              />
              <div className="mt-1 text-xs text-slate-500">
                Toplu geri al ve sil işleminde açıklama zorunludur.
              </div>
            </div>
          </>
        ) : null}
      </ActionConfirmModal>

      <ActionConfirmModal
        open={vm.pendingPaymentCancel != null}
        title="Ödeme İptal Onayı"
        description={
          vm.pendingPaymentCancel
            ? `${vm.pendingPaymentCancel.memberDisplayName} için ${vm.pendingPaymentCancel.periodLabel} dönemine ait ${formatCurrency(
                vm.pendingPaymentCancel.amount,
                vm.pendingPaymentCancel.currency
              )} ödeme kaydı iptal edilecek.`
            : ""
        }
        warningText="Bu işlem ödeme kaydını silmez, iptal durumuna alır. İlgili dönemin borcu yeniden açılabilir."
        confirmText="Ödemeyi İptal Et"
        cancelText="Vazgeç"
        confirmTone="danger"
        confirmDisabled={isPaymentCancelConfirmDisabled}
        isSubmitting={vm.cancellingPaymentId != null}
        onCancel={() => vm.setPendingPaymentCancel(null)}
        onConfirm={vm.confirmCancelPayment}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            İptal sebebi
          </label>
          <select
            value={vm.paymentCancelReasonCode}
            onChange={(e) =>
              vm.setPaymentCancelReasonCode(
                e.target.value as typeof vm.paymentCancelReasonCode
              )
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="">Sebep seç</option>
            {cancellationReasonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Açıklama
          </label>
          <textarea
            value={vm.paymentCancelNote}
            onChange={(e) => vm.setPaymentCancelNote(e.target.value)}
            rows={3}
            placeholder="İsteğe bağlı açıklama"
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none"
          />
          <div className="mt-1 text-xs text-slate-500">
            Sebep seçimi zorunludur. “Diğer” seçilirse açıklama da zorunlu olur.
          </div>
        </div>
      </ActionConfirmModal>

      <div className="space-y-6">
        <PaymentDashboardHeroCard
          collectionType={vm.collectionType}
          activePeriodLabel={vm.activePeriodLabel}
          totalCollectedAmount={vm.totalCollectedAmount}
          totalExpectedAmount={vm.totalExpectedAmount}
          collectionRate={vm.collectionRate}
          currency={vm.activeCurrency}
        />

        {vm.pageError ? (
          <div
            className="rounded-[28px] border p-4 text-sm"
            style={{
              borderColor: "var(--danger-border)",
              backgroundColor: "var(--danger-bg)",
              color: "var(--danger-text)",
            }}
          >
            {vm.pageError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {stats.map((stat) => (
            <PaymentStatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              accentTone={stat.accentTone}
              onClick={stat.onClick}
              isActive={stat.isActive}
              badge={stat.badge}
            />
          ))}
        </div>

        <PaymentSettingsPanel
          isOpen={vm.isSettingsPanelOpen}
          isSavingAll={vm.isSavingAll}
          isAddingRevision={vm.isAddingRevision}
          controlsDisabled={vm.controlsDisabled}
          settingsForm={vm.settingsForm}
          planForm={vm.planForm}
          revisionForm={vm.revisionForm}
          compatiblePlans={vm.compatiblePlans}
          selectedPlanYear={vm.selectedPlanYear}
          selectedPlan={vm.selectedPlan}
          deletingPlanYear={vm.deletingPlanYear}
          isRevisionPanelOpen={vm.isRevisionPanelOpen}
          onToggleOpen={() => vm.setIsSettingsPanelOpen((prev) => !prev)}
          onSaveAll={vm.handleSaveAll}
          onSettingsFormChange={vm.setSettingsForm}
          onPlanFormChange={vm.setPlanForm}
          onRevisionFormChange={vm.setRevisionForm}
          onToggleRevisionPanel={() => vm.setIsRevisionPanelOpen((prev) => !prev)}
          onAddRevision={vm.handleAddRevision}
          onDeletePlan={vm.requestDeletePlan}
        />

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.8fr)_minmax(340px,0.9fr)]">
          <div className="min-w-0">
            <AppCard>
              <PaymentMembersSection
                isLoading={vm.isLoading}
                filteredMembers={vm.filteredMembers}
                search={vm.search}
                statusFilter={vm.statusFilter}
                activeCurrency={vm.activeCurrency}
                expandedMemberIds={vm.expandedMemberIds}
                periodsByMember={vm.periodsByMember}
                periodYearFilterByMember={vm.periodYearFilterByMember}
                showOpenOnlyByMember={vm.showOpenOnlyByMember}
                paymentAmountByPeriod={vm.paymentAmountByPeriod}
                payingPeriodId={vm.payingPeriodId}
                cancellingPaymentId={vm.cancellingPaymentId}
                onSearchChange={vm.setSearch}
                onStatusFilterChange={vm.setStatusFilter}
                onToggleMember={vm.toggleMember}
                onYearFilterChange={vm.handleYearFilterChange}
                onShowOpenOnlyToggle={vm.handleShowOpenOnlyToggle}
                onRefreshMemberPeriods={vm.handleRefreshMemberPeriods}
                onPaymentAmountChange={(periodId, value) =>
                  vm.setPaymentAmountByPeriod((prev) => ({
                    ...prev,
                    [periodId]: value,
                  }))
                }
                onOpenPaymentConfirm={vm.openPaymentConfirm}
                onRequestCancelPaymentForPeriod={vm.requestCancelPaymentForPeriod}
                getCancelablePaymentForPeriod={vm.getCancelablePaymentForPeriod}
                getRevisionNotice={vm.getRevisionNotice}
              />
            </AppCard>
          </div>

          <div className="min-w-0">
            <PaymentSidePanels
              filteredRecentPayments={vm.filteredRecentPayments}
              filteredTopDebtors={vm.filteredTopDebtors}
              filteredRegularPayers={vm.filteredRegularPayers}
              filteredNeverPaidMembers={vm.filteredNeverPaidMembers}
              recentSearch={vm.recentSearch}
              recentPaymentStatusFilter={vm.recentPaymentStatusFilter}
              topDebtorsSearch={vm.topDebtorsSearch}
              regularPayersSearch={vm.regularPayersSearch}
              neverPaidSearch={vm.neverPaidSearch}
              activeCurrency={vm.activeCurrency}
              cancellingPaymentId={vm.cancellingPaymentId}
              onRecentSearchChange={vm.setRecentSearch}
              onRecentPaymentStatusFilterChange={vm.setRecentPaymentStatusFilter}
              onTopDebtorsSearchChange={vm.setTopDebtorsSearch}
              onRegularPayersSearchChange={vm.setRegularPayersSearch}
              onNeverPaidSearchChange={vm.setNeverPaidSearch}
              onRequestCancelPayment={vm.requestCancelPayment}
            />
          </div>
        </div>

        <div className="hidden">{organizationId}</div>
      </div>
    </AppPage>
  );
}