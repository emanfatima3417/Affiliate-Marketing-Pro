import { LegalPageShell, LegalSection } from "@/components/shared/legal-page";

export const metadata = { title: "Terms of Service — Marketplace Pro" };

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="[Insert date]">
      <LegalSection title="1. Acceptance of terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of [Company Name]&apos;s
          website and services (the &quot;Platform&quot;), operating as an affiliate marketplace connecting
          sellers, affiliates, and customers. By creating an account or using the Platform, you agree to be bound
          by these Terms. If you do not agree, do not use the Platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Description of service">
        <p>
          The Platform allows registered sellers to list products for sale, registered affiliates to generate
          tracked referral links and earn commissions on resulting sales, and customers to browse and purchase
          products. [Company Name] operates the Platform but does not itself manufacture, own, or ship the
          products listed by sellers unless explicitly stated.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility and accounts">
        <ul className="list-disc space-y-1 pl-5">
          <li>You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account.</li>
          <li>You must provide accurate, current information when registering and keep it up to date.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</li>
          <li>One person or legal entity may hold multiple role-based accounts (e.g. seller and affiliate) where the Platform permits it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Seller terms">
        <ul className="list-disc space-y-1 pl-5">
          <li>Seller accounts require approval before products can be listed. [Company Name] may approve, reject, or suspend seller accounts at its discretion.</li>
          <li>Sellers are solely responsible for the accuracy of product listings (title, description, price, stock, images), for the legality of items sold, and for fulfilling orders in a timely manner.</li>
          <li>Sellers set the affiliate commission percentage for their own products, subject to any platform-wide minimum or maximum set by [Company Name].</li>
          <li>Prohibited items include, without limitation, illegal goods, counterfeit goods, hazardous materials without proper certification, and anything violating applicable law. [Company Name] may remove listings that violate this policy without notice.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Affiliate program terms">
        <ul className="list-disc space-y-1 pl-5">
          <li>Affiliates earn a commission, calculated as a percentage of the sale price, on purchases completed through their unique tracked referral link within the attribution window tracked by the Platform.</li>
          <li>Commission rates are set per product by the seller (or the platform default) and may change at any time for future sales; changes do not apply retroactively to already-completed orders.</li>
          <li>Fraudulent traffic generation, click manipulation, cookie stuffing, self-referral to inflate commissions, or any other manipulation of the tracking system is strictly prohibited and grounds for forfeiture of unpaid commissions and account termination.</li>
          <li>Commission balances are paid out at [Company Name]&apos;s discretion or upon request, subject to a minimum payout threshold of [$__] and standard processing time of [__] business days.</li>
          <li>If an order is refunded or cancelled, any commission associated with that order may be reversed from the affiliate&apos;s balance.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Orders, pricing, and payment">
        <p>
          All prices are listed in [USD] and displayed exclusive/inclusive of applicable taxes as configured by
          each seller. Payment is processed via Stripe; [Company Name] does not store your full card details.
          Orders are subject to product availability. [Company Name] reserves the right to cancel any order due
          to pricing errors, suspected fraud, or unavailability of stock.
        </p>
      </LegalSection>

      <LegalSection title="7. Returns and refunds">
        <p>
          Returns, cancellations, and refunds are governed by our{" "}
          <a href="/refund-policy" className="text-accent underline">Refund Policy</a>, which is incorporated into
          these Terms by reference.
        </p>
      </LegalSection>

      <LegalSection title="8. Prohibited conduct">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the Platform for any unlawful purpose or in violation of any applicable regulation.</li>
          <li>Attempt to gain unauthorized access to any part of the Platform, other accounts, or connected systems.</li>
          <li>Upload malicious code, scrape the Platform at scale, or interfere with its normal operation.</li>
          <li>Impersonate another person or misrepresent your affiliation with any entity.</li>
          <li>Manipulate affiliate tracking, reviews, ratings, or order data.</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Intellectual property">
        <p>
          The Platform&apos;s design, branding, and underlying software are the property of [Company Name] or its
          licensors. Sellers retain ownership of their product content but grant [Company Name] a license to
          display it on the Platform for the purpose of operating the marketplace.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimers and limitation of liability">
        <p>
          The Platform is provided &quot;as is&quot; without warranties of any kind, express or implied.
          [Company Name] is not responsible for the quality, safety, legality, or accuracy of listings created by
          third-party sellers. To the maximum extent permitted by law, [Company Name]&apos;s total liability
          arising from your use of the Platform is limited to the amount you paid to [Company Name] in the twelve
          (12) months preceding the claim.
        </p>
      </LegalSection>

      <LegalSection title="11. Indemnification">
        <p>
          You agree to indemnify and hold [Company Name] harmless from any claims, damages, or expenses arising
          from your breach of these Terms, your use of the Platform, or content you submit to it.
        </p>
      </LegalSection>

      <LegalSection title="12. Termination">
        <p>
          [Company Name] may suspend or terminate your account at any time for violation of these Terms. You may
          close your account at any time by contacting support.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing law and disputes">
        <p>
          These Terms are governed by the laws of [State/Country], without regard to conflict-of-law principles.
          Any disputes shall be resolved in the courts located in [Jurisdiction], unless applicable consumer
          protection law requires otherwise.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes to these terms">
        <p>
          [Company Name] may update these Terms from time to time. Continued use of the Platform after changes
          take effect constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>Questions about these Terms can be directed to [support@yourdomain.com].</p>
      </LegalSection>
    </LegalPageShell>
  );
}
