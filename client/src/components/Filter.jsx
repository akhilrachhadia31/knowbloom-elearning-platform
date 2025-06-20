// src/components/Filter.jsx

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

// ──────── EXPANDED CATEGORIES ────────
const ALL_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Fullstack Development",
  "JavaScript",
  "Python",
  "Data Science",
  "Artificial Intelligence",
  "Machine Learning",
  "UI/UX Design",
  "Graphic Design",
  "Digital Marketing",
  "Photography",
  "Music & Audio",
  "Business Management",
  "Entrepreneurship",
  "Finance & Accounting",
  "Personal Development",
  "Health & Fitness",
  "Language Learning",
  "Teaching & Academics",
];

// ──────── LEVELS (Exact casing to match `course.courseLevel` field) ────────
const ALL_LEVELS = ["Beginner", "Medium", "Advance"];

const Filter = ({ handleFilterChange }) => {
  // ─────────────────────────────────────────────────────────────
  // Local filter state (these four values get pushed up to SearchPage)
  // ─────────────────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceRange, setPriceRange] = useState("all"); // "all" | "free" | "paid"
  const [sortByPrice, setSortByPrice] = useState(""); // "" | "low" | "high"

  // Whenever any filter state changes, call the parent callback:
  // handleFilterChange(categoriesArray, levelsArray, priceRangeString, sortByPriceString)
  useEffect(() => {
    handleFilterChange(
      selectedCategories,
      selectedLevels,
      priceRange,
      sortByPrice
    );
  }, [selectedCategories, selectedLevels, priceRange, sortByPrice]);

  // ─────────────────────────────────────────────────────────────
  // 1) CATEGORY toggle helper
  // ─────────────────────────────────────────────────────────────
  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 2) LEVEL toggle helper (matching capitalization exactly)
  // ─────────────────────────────────────────────────────────────
  const toggleLevel = (levelValue) => {
    setSelectedLevels((prev) =>
      prev.includes(levelValue)
        ? prev.filter((l) => l !== levelValue)
        : [...prev, levelValue]
    );
  };

  return (
    <aside className="w-full md:w-64">
      <div className="p-5 space-y-8 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
        {/* ─── 1. CATEGORY FILTER ─────────────────────────────────── */}
        <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">
            Categories
          </h2>
          <div className="max-h-52 overflow-y-auto pr-2">
            {ALL_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center space-x-3 mb-2 cursor-pointer"
              >
                <Checkbox
                  checked={selectedCategories.includes(cat)}
                  onCheckedChange={() => toggleCategory(cat)}
                  className="border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ─── 2. LEVEL FILTER ─────────────────────────────────────── */}
        <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">
            Level
          </h2>
          <div className="space-y-2">
            {ALL_LEVELS.map((lvl) => (
              <label
                key={lvl}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <Checkbox
                  checked={selectedLevels.includes(lvl)}
                  onCheckedChange={() => toggleLevel(lvl)}
                  className="border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {lvl}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ─── 3. PRICE-RANGE FILTER ───────────────────────────────── */}
        <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">
            Price
          </h2>
          <RadioGroup
            value={priceRange}
            onValueChange={(val) => setPriceRange(val)}
            className="space-y-2"
          >
            <label className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem
                value="all"
                className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                All
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem
                value="free"
                className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Free only
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem
                value="paid"
                className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Paid only
              </span>
            </label>
          </RadioGroup>
        </div>

        {/* ─── 4. SORT BY PRICE DROPDOWN ───────────────────────────── */}
        <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">
            Sort By
          </h2>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortByPrice}
            onChange={(e) => setSortByPrice(e.target.value)}
          >
            <option value="">None</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>

        {/* ─── 5. CLEAR ALL FILTERS BUTTON ─────────────────────────── */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => {
            setSelectedCategories([]);
            setSelectedLevels([]);
            setPriceRange("all");
            setSortByPrice("");
          }}
        >
          Clear All
        </Button>
      </div>
    </aside>
  );
};

export default Filter;
