"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/format";
import { useCheckoutState } from "../state/useCheckoutState";
import type { Draft } from "../types";
import { AddressFormModal } from "./AddressFormModal";
import { CheckoutHeader } from "./CheckoutHeader";
import { DamageProtectionRow } from "./DamageProtectionRow";
import { DeliveryAddressRow } from "./DeliveryAddressRow";
import { MobileCheckoutBar } from "./MobileCheckoutBar";
import { OrderReceivedModal } from "./OrderReceivedModal";
import { PaymentMethodRow } from "./PaymentMethodRow";
import { PaymentMethodsModal } from "./PaymentMethodsModal";
import { PurchasedItems } from "./PurchasedItems";
import { ShippingOptionsModal } from "./ShippingOptionsModal";
import { ShippingRow } from "./ShippingRow";
import { ShoppingSummary } from "./ShoppingSummary";
import { VoucherRow } from "./VoucherRow";
import { VouchersModal } from "./VouchersModal";

type Modal = "address" | "shipping" | "voucher" | "payment" | null;

/**
 * The checkout screen. One component tree for every screen size: the summary card and Pay Now button
 * (desktop), the bottom bar and back bar (mobile and tablet) are shown with Tailwind's `lg:` classes.
 */
export function CheckoutPage({ initialDraft }: { initialDraft: Draft }) {
  const router = useRouter();
  const checkout = useCheckoutState(initialDraft);
  const [modal, setModal] = useState<Modal>(null);
  const { draft, pending } = checkout;
  const paying = pending.has("order");
  const close = () => setModal(null);

  return (
    <div>
      <CheckoutHeader />

      <div className="mx-auto max-w-300 px-4 pb-6 lg:px-6 lg:py-8">
        <h1 className="py-4 font-serif text-3xl font-bold text-brand lg:pt-0">Checkout</h1>

        {checkout.error && (
          <Alert variant="error" message={checkout.error} onClose={checkout.dismissError} className="mb-4" />
        )}

        <div className="lg:grid lg:grid-cols-[minmax(0,65fr)_minmax(0,30fr)] lg:justify-between lg:gap-8">
          <div className="flex flex-col gap-4">
            <DeliveryAddressRow address={draft.address} onOpen={() => setModal("address")} />

            <PurchasedItems groups={checkout.groups} onChangeQuantity={checkout.changeQuantity} />

            <DamageProtectionRow
              enabled={draft.damageProtection.enabled}
              fee={draft.damageProtection.fee}
              pending={pending.has("damage")}
              onChange={checkout.setDamageProtection}
            />
            <ShippingRow shipping={draft.shipping} pending={pending.has("shipping")} onOpen={() => setModal("shipping")} />
            <VoucherRow voucher={draft.voucher} pending={pending.has("voucher")} onOpen={() => setModal("voucher")} />

            {draft.voucher && (
              <div className="flex items-center justify-between text-xs">
                <span>Product Discount</span>
                <span className="font-bold">{formatCurrency(draft.summary.discount)}</span>
              </div>
            )}

            <PaymentMethodRow method={draft.paymentMethod} pending={pending.has("payment")} onOpen={() => setModal("payment")} />

            {/* Below 1024px the summary is part of the page; from 1024px it is the sticky right column. */}
            <ShoppingSummary
              draft={draft}
              canPay={checkout.canPay}
              hint={checkout.payHint}
              paying={paying}
              onPay={checkout.pay}
              showPayButton={false}
              className="lg:hidden"
            />
          </div>

          <ShoppingSummary
            draft={draft}
            canPay={checkout.canPay}
            hint={checkout.payHint}
            paying={paying}
            onPay={checkout.pay}
            showPayButton
            className="hidden self-start lg:sticky lg:top-6 lg:block"
          />
        </div>
      </div>

      <MobileCheckoutBar
        total={draft.summary.total}
        canPay={checkout.canPay}
        hint={checkout.payHint}
        paying={paying}
        onPay={checkout.pay}
      />

      <AddressFormModal open={modal === "address"} address={draft.address} onSave={checkout.saveAddress} onClose={close} />
      <ShippingOptionsModal
        open={modal === "shipping"}
        selectedId={draft.shipping?.id}
        onSelect={(optionId) => {
          close();
          if (optionId !== draft.shipping?.id) void checkout.selectShipping(optionId);
        }}
        onClose={close}
      />
      <VouchersModal
        open={modal === "voucher"}
        selectedId={draft.voucher?.id}
        onSelect={(voucherId) => {
          close();
          void checkout.selectVoucher(voucherId);
        }}
        onClose={close}
      />
      <PaymentMethodsModal
        open={modal === "payment"}
        selectedId={draft.paymentMethod?.id}
        onSelect={(methodId) => {
          close();
          if (methodId !== draft.paymentMethod?.id) void checkout.selectPaymentMethod(methodId);
        }}
        onClose={close}
      />
      <OrderReceivedModal open={checkout.orderCode !== null} code={checkout.orderCode} onClose={() => router.replace("/products")} />
    </div>
  );
}
