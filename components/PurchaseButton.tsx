"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

type PurchaseButtonProps = {
  href: string;
  listingId: string;
  variantId?: string;
  productGroupId?: string;
};

export function PurchaseButton({
  href,
  listingId,
  variantId,
  productGroupId
}: PurchaseButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);

    try {
      await fetch("/api/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId,
          variantId,
          productGroupId,
          targetUrl: href
        })
      });
    } finally {
      setPending(false);
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-coral disabled:cursor-wait disabled:opacity-70"
    >
      <ExternalLink aria-hidden="true" className="h-4 w-4" />
      {pending ? "이동 준비중" : "구매처로 이동"}
    </button>
  );
}
