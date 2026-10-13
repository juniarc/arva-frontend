"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { BackButton } from "@/features/products/components/BackButton";
import { createShop } from "../api/shop.client";
import { toEditRequest } from "../mappers/shop.mapper";
import { identityFormSchema, type IdentityValues } from "../schemas/create-shop.schema";
import { SHOP_EDIT_FIELDS, shopEditFormSchema, type ShopEditValues } from "../schemas/shop-edit.schema";
import type { ShippingChannel } from "../types";
import { IdentityStep } from "./IdentityStep";
import { ShopCreatedStep } from "./ShopCreatedStep";
import { ShopFeedback, type ShopNotice } from "./ShopFeedback";
import { ShopInfoStep } from "./ShopInfoStep";
import { WIZARD_STEPS, WizardStepper } from "./WizardStepper";

export const INCOMPLETE_MESSAGE = "Please complete the required fields.";
export const CREATE_FAILED_MESSAGE = "Could not create your shop. Please try again.";

const EMPTY_SHOP: ShopEditValues = {
  name: "",
  provinceId: "",
  cityId: "",
  districtId: "",
  subDistrictId: "",
  street: "",
  shippingChannelIds: [],
  email: "",
  phone: "",
  openingTime: "09:00",
  closingTime: "17:00",
};

type Step = 1 | 2 | 3;

/**
 * The create-shop wizard. Both forms live here, so what the user typed in a step is kept when they go back.
 * The shop is created when step 2 is finished. Step 3 (uploading a product) is not built yet.
 * Step 1 is checked here but not sent: the backend's create endpoint does not take the identity yet.
 */
export function CreateShopWizard({ channels }: { channels: ShippingChannel[] | null }) {
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<ShopNotice | null>(null);
  const [created, setCreated] = useState<{ slug: string; name: string } | null>(null);

  const identityForm = useForm<IdentityValues>({
    resolver: zodResolver(identityFormSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: { ownerName: "", icNumber: "", acceptedTerms: false },
  });
  const shopForm = useForm<ShopEditValues>({
    resolver: zodResolver(shopEditFormSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: EMPTY_SHOP,
  });

  // Each step moves focus to its title, so a screen reader announces where the user is. Not on the first render.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const incomplete = () => setNotice({ kind: "error", message: INCOMPLETE_MESSAGE });

  const nextFromIdentity = identityForm.handleSubmit(() => {
    setNotice(null);
    setStep(2);
  }, incomplete);

  const createFromShopInfo = shopForm.handleSubmit(async (values) => {
    setNotice(null);
    setSaving(true);
    const result = await createShop(toEditRequest(values));
    setSaving(false);

    if (result.ok) {
      // The IC number is not needed any more: it does not stay in memory.
      identityForm.reset({ ownerName: "", icNumber: "", acceptedTerms: false });
      setCreated({ slug: result.data.slug, name: result.data.name });
      setStep(3);
      return;
    }

    // Messages for known fields go under the field. The backend's own wording for a field we do not know is not shown.
    const messages: Record<string, string> = {};
    if (result.status === 409 && result.field) messages[result.field] = result.message;
    if (result.status === 400) Object.assign(messages, result.errors);

    let shown = false;
    for (const [field, message] of Object.entries(messages)) {
      if (!SHOP_EDIT_FIELDS.includes(field)) continue;
      shopForm.setError(field as keyof ShopEditValues, { type: "server", message });
      shown = true;
    }

    // A 409 without a field (for example "you already have a shop") has a message written for the user.
    if (!shown) setNotice({ kind: "error", message: result.status === 409 ? result.message : CREATE_FAILED_MESSAGE });
  }, incomplete);

  return (
    <>
      {/* Mobile and tablet: the back arrow under the global header (the header already has search, cart and menu). */}
      <div className="flex items-center px-2 py-1 lg:hidden">
        <BackButton className="bg-transparent shadow-none" />
      </div>

      <div className="mx-auto max-w-300 px-4 pb-10 pt-2 lg:px-6 lg:pt-8">
        <div className="flex flex-col gap-4">
          {/* The title comes first on mobile and tablet, the progress first from 1024px (as in the design). */}
          <h1
            id="create-shop-heading"
            ref={headingRef}
            tabIndex={-1}
            className="order-1 text-center font-serif text-xl font-bold text-ink outline-none lg:order-2 lg:text-left lg:text-2xl"
          >
            {WIZARD_STEPS[step - 1]}
          </h1>
          <div className="order-2 lg:order-1">
            <WizardStepper current={step} />
          </div>
        </div>

        <div className="mt-4">
          <ShopFeedback notice={notice} onClose={() => setNotice(null)} />
          {step === 1 && <IdentityStep form={identityForm} onNext={nextFromIdentity} />}
          {step === 2 && (
            <ShopInfoStep
              form={shopForm}
              channels={channels}
              saving={saving}
              onBack={() => {
                setNotice(null);
                setStep(1);
              }}
              onNext={createFromShopInfo}
            />
          )}
          {step === 3 && created && <ShopCreatedStep shop={created} />}
        </div>
      </div>
    </>
  );
}
