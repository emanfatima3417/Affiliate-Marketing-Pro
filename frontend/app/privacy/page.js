import { LegalPageShell, LegalSection } from "@/components/shared/legal-page";

export const metadata = { title: "Privacy Policy — Marketplace Pro" };

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="[Insert date]">
      <LegalSection title="1. Introduction">
        <p>
          This Privacy Policy explains how [Company Name] (&quot;we&quot;, &quot;us&quot;) collects, uses, and
          shares information when you use our affiliate marketplace platform (the &quot;Platform&quot;).
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Account information:</strong> name, email address, hashed password, and role (customer, seller, or affiliate) when you register.</li>
          <li><strong>Order information:</strong> shipping address, phone number, and order history when you make a purchase.</li>
          <li><strong>Payment information:</strong> processed directly by Stripe. We do not store full card numbers on our servers.</li>
          <li><strong>Affiliate tracking data:</strong> if you click an affiliate link, we log the referral code, the product, a timestamp, and technical metadata (IP address, user agent, referring page) to attribute the resulting sale, if any.</li>
          <li><strong>Usage data:</strong> pages visited, cart contents, and wishlist items, some of which are stored locally in your browser (see Cookies below) rather than on our servers.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <ul className="list-disc space-y-1 pl-5">
          <li>To create and manage your account and authenticate you when you log in.</li>
          <li>To process orders, calculate applicable affiliate commissions, and facilitate fulfillment between sellers and customers.</li>
          <li>To send transactional emails: order confirmations, password resets, seller approval decisions, commission and payout notifications.</li>
          <li>To detect and prevent fraud, including affiliate click manipulation.</li>
          <li>To improve the Platform and understand aggregate usage patterns.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cookies and local storage">
        <p>
          The Platform uses your browser&apos;s local storage (not third-party tracking cookies) to remember your
          login session, shopping cart, wishlist, and an affiliate referral code if you arrived via a tracked
          link — this is what allows commission to be correctly attributed if you complete a purchase later in
          the same browser. You can clear this at any time by clearing your browser&apos;s site data, though
          doing so will log you out and empty your cart.
        </p>
      </LegalSection>

      <LegalSection title="5. How we share information">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Sellers</strong> see the shipping address, name, and order details necessary to fulfill orders placed for their products.</li>
          <li><strong>Service providers:</strong> Stripe (payment processing), Cloudinary (image hosting), our email delivery provider (transactional email), and our database/hosting providers (MongoDB Atlas, and our application hosts) process data on our behalf under their own privacy and security commitments.</li>
          <li>We do not sell your personal information to third parties.</li>
          <li>We may disclose information if required by law or to protect the rights, safety, or property of [Company Name] or others.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Data retention">
        <p>
          We retain account and order information for as long as your account is active and as needed to comply
          with legal, tax, and accounting obligations. You may request deletion of your account as described
          below, subject to records we're legally required to retain.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights and choices">
        <p>
          Depending on your location, you may have rights to access, correct, export, or delete your personal
          information (for example, under GDPR in the EU/UK or CCPA in California). To exercise these rights,
          contact us at [privacy@yourdomain.com]. We will respond within the timeframe required by applicable
          law.
        </p>
      </LegalSection>

      <LegalSection title="8. Data security">
        <p>
          Passwords are hashed (never stored in plain text). Password reset tokens are stored only as a hash and
          expire after 30 minutes. We use industry-standard practices to protect data in transit (HTTPS) and at
          rest, though no system can guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="9. Children's privacy">
        <p>
          The Platform is not directed to children under 18 (or the applicable age of digital consent in your
          jurisdiction), and we do not knowingly collect personal information from children.
        </p>
      </LegalSection>

      <LegalSection title="10. International data transfers">
        <p>
          Depending on where our hosting and service providers are located, your information may be processed in
          a country other than your own. Where required, we rely on appropriate safeguards (such as standard
          contractual clauses) for such transfers.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the updated version with a new
          &quot;Last updated&quot; date at the top of this page.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact us">
        <p>Questions about this Privacy Policy can be directed to [privacy@yourdomain.com].</p>
      </LegalSection>
    </LegalPageShell>
  );
}
