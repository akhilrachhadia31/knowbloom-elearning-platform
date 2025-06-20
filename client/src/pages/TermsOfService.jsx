// src/pages/TermsOfService.jsx
import React from "react";

const TermsOfService = () => (
  <div className="prose prose-lg dark:prose-invert max-w-3xl mx-auto px-4 py-12">
    <h1>Terms of Service</h1>
    <p>Effective date: January 1, 2025</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By using KnowBloom, you agree to these terms and our Privacy Policy.</p>

    <h2>2. Accounts</h2>
    <p>
      You must provide accurate info. You’re responsible for safeguarding your
      password.
    </p>

    <h2>3. Course Access &amp; Content</h2>
    <p>
      All course materials are licensed, not sold. You may not redistribute or
      resell content.
    </p>

    <h2>4. Payments &amp; Refunds</h2>
    <p>
      Fees are non-refundable except as provided in our{" "}
      <a href="/refund-policy" className="text-cyan-600">
        Refund Policy
      </a>
      .
    </p>

    <h2>5. Code of Conduct</h2>
    <p>
      User-generated content must comply with community guidelines; no
      harassment, hate, or illegal content.
    </p>

    <h2>6. Intellectual Property</h2>
    <p>
      All trademarks, logos, and course materials are property of KnowBloom or
      our licensors.
    </p>

    <h2>7. Termination</h2>
    <p>We may suspend or terminate accounts for violation of these terms.</p>

    <h2>8. Limitation of Liability</h2>
    <p>KnowBloom is not liable for indirect damages or lost profits.</p>

    <h2>9. Governing Law</h2>
    <p>
      These terms are governed by the laws of India, without regard to conflict
      of law principles.
    </p>

    <h2>10. Contact</h2>
    <p>
      Questions? Email us at{" "}
      <a href="mailto:knowbloom.team@gmail.com" className="text-cyan-600">
        knowbloom.team@gmail.com
      </a>
      .
    </p>
  </div>
);

export default TermsOfService;
