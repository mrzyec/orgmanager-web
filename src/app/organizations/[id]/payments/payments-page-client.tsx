"use client";

import { useToast } from "@/components/ToastProvider";
import ActionConfirmModal from "@/components/ActionConfirmModal";
import PaymentDashboardHeroCard from "./_payments-components/payment-dashboard-hero-card";
import PaymentMembersSection from "./_payments-components/payment-members-section";
import PaymentSidePanels from "./_payments-components/payment-side-panels";
import PaymentStatCard from "./_payments-components/payment-stat-card";
import PaymentSettingsPanel from "./_payments-components/payment-settings-panel";
import { formatCurrency } from "./_payments-lib/payment-formatters";
import { useOrganizationPaymentsPage } from "./_payments-hooks/use-organization-payments-page";

export default function OrganizationPaymentsPageClient({
  organizationId,
}: {
  organizationId: string;
}) {
  const { showToast } = useToast();

  const vm = useOrganizationPaymentsPage({
    organizationId,
    showToast,
  });

  return (
    <>
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
        title="Aidat Planı Silme Onayı"
        description={
          vm.pendingPlanDelete
            ? `${vm.pendingPlanDelete.year} ${
                vm.pendingPlanDelete.period === "Yearly" ? "yıllık" : "aylık"
              } aidat planı silinecek.`
            : ""
        }
        warningText="Bu işlem planı ve bu plana bağlı borç üretimini etkiler. Bu yıl için ödeme alınmış planlar zaten silinemez."
        confirmText="Planı Sil"
        cancelText="Vazgeç"
        confirmTone="danger"
        isSubmitting={
          vm.pendingPlanDelete != null &&
          vm.deletingPlanYear === vm.pendingPlanDelete.year
        }
        onCancel={() => vm.setPendingPlanDelete(null)}
        onConfirm={vm.confirmDeletePlan}
      />

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
        isSubmitting={
          vm.pendingPaymentCancel != null &&
          vm.cancellingPaymentId === vm.pendingPaymentCancel.paymentId
        }
        onCancel={() => vm.setPendingPaymentCancel(null)}
        onConfirm={vm.confirmCancelPayment}
      />

      <div className="space-y-6 rounded-[32px] bg-[#e5e7eb] p-3">
        <PaymentDashboardHeroCard
          collectionType={vm.collectionType}
          activePeriodLabel={vm.activePeriodLabel}
          totalCollectedAmount={vm.totalCollectedAmount}
          totalExpectedAmount={vm.totalExpectedAmount}
          collectionRate={vm.collectionRate}
          currency={vm.activeCurrency}
        />

        {vm.pageError ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {vm.pageError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
          <PaymentStatCard
            title="Aidat Sistemi"
            value={vm.getCollectionTypeLabel(vm.collectionType)}
            subtitle={`Aktif dönem: ${vm.activePeriodLabel}`}
            accentClass="bg-slate-900"
            onClick={() => vm.setIsSettingsPanelOpen((prev) => !prev)}
            isActive={vm.isSettingsPanelOpen}
            badge={
              vm.isSettingsPanelOpen
                ? "Ayarlar açık"
                : vm.settings?.isEnabled
                ? "Açık"
                : "Kapalı"
            }
          />

          <PaymentStatCard
            title="Ödeme Beklenen Üye"
            value={String(vm.members.length)}
            subtitle={`Hiç ödeme yapmayan: ${vm.neverPaidCount}`}
            accentClass="bg-sky-500"
          />

          <PaymentStatCard
            title="Tam Ödeyen"
            value={String(vm.paidCount)}
            subtitle={`Tahsilat oranı: %${vm.collectionRate.toFixed(0)}`}
            accentClass="bg-emerald-500"
          />

          <PaymentStatCard
            title="Kısmi Ödeyen"
            value={String(vm.partialCount)}
            subtitle="Bu döneme ait eksik ödeme var"
            accentClass="bg-amber-500"
          />

          <PaymentStatCard
            title="Geciken Üye"
            value={String(vm.overdueCount)}
            subtitle="Açık geçmiş dönem borcu bulunuyor"
            accentClass="bg-rose-500"
          />

          <PaymentStatCard
            title="Kalan Alacak"
            value={formatCurrency(vm.totalRemainingAmount, vm.activeCurrency)}
            subtitle={`Bekleyen: ${String(vm.unpaidCount)}`}
            accentClass="bg-indigo-500"
          />
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
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
              onRequestCancelPayment={vm.requestCancelPayment}
              getCancelablePaymentForPeriod={vm.getCancelablePaymentForPeriod}
              getRevisionNotice={vm.getRevisionNotice}
            />
          </div>

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

        <div className="hidden">{organizationId}</div>
      </div>
    </>
  );
}