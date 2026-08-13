import { LegalPageShell, LegalSection } from "@/components/shared/legal-page";

export const metadata = { title: "Refund Policy — Marketplace Pro" };

export default function RefundPolicyPage() {
  return (
    <LegalPageShell title="Refund Policy" lastUpdated="[Insert date]">
      <LegalSection title="1. Overview">
        <p>
          This policy explains when and how you can request a refund for a purchase made on [Company Name]&apos;s
          marketplace. Because products are listed and fulfilled by independent sellers, specific return windows
          or conditions may vary by seller within the limits set out below — check the individual product page
          for any seller-specific terms.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility for refunds">
        <ul className="list-disc space-y-1 pl-5">
          <li>Requests must be submitted within [30] days of the delivery date.</li>
          <li>Items must be unused, in their original packaging, and in the condition they were received, unless the item arrived damaged or defective.</li>
          <li>Proof of purchase (order number) is required.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Non-refundable items">
        <p>The following are generally not eligible for refund unless defective or not as described:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Digital or intangible goods once accessed or delivered (e.g. digital gold, invoices, or similar non-physical listings).</li>
          <li>Perishable goods (e.g. food and beverage items).</li>
          <li>Items marked as final sale at time of purchase.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. How to request a refund">
        <p>
          Contact the seller directly through your order history, or reach out to [support@yourdomain.com] with
          your order number and reason for the request. We will facilitate communication between you and the
          seller and step in to mediate if a resolution isn&apos;t reached directly.
        </p>
      </LegalSection>

      <LegalSection title="5. Refund processing">
        <p>
          Approved refunds are issued to your original payment method via Stripe, typically within [5–10]
          business days of approval. Processing times beyond that are determined by your card issuer or bank and
          outside our control.
        </p>
      </LegalSection>

      <LegalSection title="6. Affiliate commission reversals">
        <p>
          If an order that generated an affiliate commission is later refunded or cancelled, the associated
          commission is subject to reversal from the referring affiliate&apos;s balance. If the commission has
          already been paid out to the affiliate, [Company Name] reserves the right to deduct the reversed amount
          from the affiliate&apos;s future earnings.
        </p>
        <p className="text-xs">
          <strong>Implementation note for developers:</strong> the current codebase tracks order and payment
          status (including a <code>refunded</code> state) and commission status, but does not yet include an
          automated endpoint that processes a Stripe refund and reverses the associated commission in one step —
          that flow is handled manually today (issue the Stripe refund, then adjust the affiliate&apos;s balance
          and commission status via the admin panel / database). Automating this end-to-end is a reasonable next
          feature to build before high order volume makes manual reversal impractical.
        </p>
      </LegalSection>

      <LegalSection title="7. Seller responsibilities">
        <p>
          Sellers are expected to honor the terms of this policy for products they list. [Company Name] may
          intervene, issue a refund on the seller&apos;s behalf, or suspend a seller&apos;s account for repeated
          failure to honor legitimate refund requests.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to this policy">
        <p>
          We may update this Refund Policy from time to time. Changes apply to orders placed after the updated
          policy is posted.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>Questions about this policy can be directed to [support@yourdomain.com].</p>
      </LegalSection>
    </LegalPageShell>
  );
}
