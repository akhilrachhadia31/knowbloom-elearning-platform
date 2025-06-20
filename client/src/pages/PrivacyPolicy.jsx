// src/pages/PrivacyPolicy.jsx
import React from "react";

const PrivacyPolicy = () => (
  <div className="prose prose-lg dark:prose-invert max-w-3xl mx-auto px-4 py-12">
    <h1>Privacy Policy</h1>

    <p>Last updated: January 1, 2025</p>

    <h2>1. Information We Collect</h2>
    <ul>
      <li>
        <strong>Account Data:</strong> Name, email, and profile details.
      </li>
      <li>
        <strong>Usage Data:</strong> Pages visited, courses accessed, time
        spent.
      </li>
      <li>
        <strong>Payment Data:</strong> Billing info, transaction records (via
        third-party processors).
      </li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To provide and improve our services.</li>
      <li>To process payments and refunds.</li>
      <li>To send updates, newsletters, and promotional offers.</li>
      <li>To monitor and analyze usage trends.</li>
    </ul>

    <h2>3. Cookies &amp; Tracking</h2>
    <p>
      We use cookies and similar technologies to personalize your experience and
      analyze site traffic. You can disable cookies via your browser settings,
      but some features may break.
    </p>

    <h2>4. Third-Party Services</h2>
    <p>
      We integrate with Stripe/Razorpay for payments, and Mailchimp for email.
      Their privacy practices govern any data they collect.
    </p>

    <h2>5. Data Security</h2>
    <p>
      We employ industry-standard measures (encryption in transit, secure
      servers) to protect your data, but no system is 100% secure.
    </p>

    <h2>6. Your Rights</h2>
    <p>
      You can request access, correction, or deletion of your personal data at
      any time by contacting knowbloom.team@gmail.com.
    </p>

    <h2>7. Changes to This Policy</h2>
    <p>
      We may update this policy; changes take effect upon posting. Check this
      page regularly.
    </p>
  </div>
);

export default PrivacyPolicy;
