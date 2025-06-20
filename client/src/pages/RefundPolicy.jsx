// src/pages/RefundPolicy.jsx
import React from "react";

const RefundPolicy = () => (
  <div className="prose prose-lg dark:prose-invert max-w-3xl mx-auto px-4 py-12">
    <h1>Refund Policy</h1>
    <p>Effective date: January 1, 2025</p>

    <h2>1. Eligibility</h2>
    <p>You may request a full refund within 30 days of purchase if:</p>
    <ul>
      <li>You have completed less than 20% of the course content.</li>
      <li>
        You experienced technical difficulties that prevented you from accessing
        the course.
      </li>
    </ul>

    <h2>2. How to Request a Refund</h2>
    <ol>
      <li>
        Email{" "}
        <a href="mailto:knowbloom.team@gmail.com" className="text-cyan-600">
          knowbloom.team@gmail.com
        </a>{" "}
        with your order ID and reason.
      </li>
      <li>Our team will review and respond within 5 business days.</li>
      <li>
        If approved, your original payment method will be credited within 7–10
        business days.
      </li>
    </ol>

    <h2>3. Non-Refundable Fees</h2>
    <p>Any transaction or bank processing fees are non-refundable.</p>

    <h2>4. Changes to This Policy</h2>
    <p>
      We may update this policy; the latest version applies to purchases made
      after the update.
    </p>

    <h2>5. Contact</h2>
    <p>
      Questions? Email{" "}
      <a href="mailto:knowbloom.team@gmail.com" className="text-cyan-600">
        knowbloom.team@gmail.com
      </a>
      .
    </p>
  </div>
);

export default RefundPolicy;
