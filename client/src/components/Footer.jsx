// src/components/Footer.jsx

import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  // Helper to build a Link to /search?query=<encodedCategory>
  const makeSearchLink = (category) =>
    `/search?query=${encodeURIComponent(category)}`;

  // Group categories into logical “fields”
  const developmentCategories = [
    "Web Development",
    "Mobile Development",
    "Fullstack Development",
    "JavaScript",
    "Python",
  ];
  const dataAI_Categories = [
    "Data Science",
    "Artificial Intelligence",
    "Machine Learning",
  ];
  const designMarketingCategories = [
    "UI/UX Design",
    "Graphic Design",
    "Digital Marketing",
    "Photography",
    "Music & Audio",
  ];
  const businessPersonalCategories = [
    "Business Management",
    "Entrepreneurship",
    "Finance & Accounting",
    "Personal Development",
    "Health & Fitness",
    "Language Learning",
    "Teaching & Academics",
  ];

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 pt-10">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Column 1: Company */}
          <div>
            <h3 className="text-xl font-semibold mb-4 dark:text-white">
              KnowBloom
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Empowering learners worldwide with industry‐focused, hands‐on
              courses. Join us to upskill and unlock your career potential.
            </p>
          </div>

          {/* Column 2: Development */}
          <div>
            <h4 className="text-lg font-medium mb-4 dark:text-white">
              Development
            </h4>
            <ul className="space-y-2">
              {developmentCategories.map((cat) => (
                <li key={cat}>
                  <Link
                    to={makeSearchLink(cat)}
                    className="text-sm hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Data & AI */}
          <div>
            <h4 className="text-lg font-medium mb-4 dark:text-white">
              Data &amp; AI
            </h4>
            <ul className="space-y-2">
              {dataAI_Categories.map((cat) => (
                <li key={cat}>
                  <Link
                    to={makeSearchLink(cat)}
                    className="text-sm hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Design & Marketing */}
          <div>
            <h4 className="text-lg font-medium mb-4 dark:text-white">
              Design &amp; Marketing
            </h4>
            <ul className="space-y-2">
              {designMarketingCategories.map((cat) => (
                <li key={cat}>
                  <Link
                    to={makeSearchLink(cat)}
                    className="text-sm hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Business & Personal */}
          <div>
            <h4 className="text-lg font-medium mb-4 dark:text-white">
              Business &amp; Personal
            </h4>
            <ul className="space-y-2">
              {businessPersonalCategories.map((cat) => (
                <li key={cat}>
                  <Link
                    to={makeSearchLink(cat)}
                    className="text-sm hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 6: Support & Legal */}
          <div>
            <h4 className="text-lg font-medium mb-4 dark:text-white">
              Support &amp; Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-sm hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="text-sm hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-6" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} KnowBloom Learning, Inc. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
