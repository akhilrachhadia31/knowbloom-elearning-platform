import React, { useState, useEffect } from "react";
import Filter from "@/components/Filter";
import SearchResult from "./SearchResult";
import { useGetSearchCourseQuery } from "@/features/api/courseApi";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SearchPage = () => {
  // ─────────────────────────────────────────────────────────────
  // 1) Read and write the "query" search‐param directly. That way,
  //    whenever the user types in the input below, we update the URL.
  //    On a page‐refresh, `query` will still be there.
  // ─────────────────────────────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";

  // Filters: categories[], levels[], priceRange, sortByPrice
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceRange, setPriceRange] = useState("all"); // "all"|"free"|"paid"
  const [sortByPrice, setSortByPrice] = useState(""); // ""|"low"|"high"

  // ─────────────────────────────────────────────────────────────
  // 2) Fetch from backend using only searchQuery + categories + sortByPrice
  //    (We still pass categories & levels so backend can filter if it supports it,
  //     but we also do client‐side level/price filtering below.)
  // ─────────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    refetch: refetchSearchResults,
  } = useGetSearchCourseQuery({
    searchQuery: query,
    categories: selectedCategories,
    level: "", // you could pass selectedLevels if your backend can filter by level
    priceRange: "", // same for server‐side price filtering, if supported
    sortByPrice,
  });

  // Re‐fetch whenever query / categories / sortByPrice changes
  useEffect(() => {
    refetchSearchResults();
  }, [query, selectedCategories, sortByPrice]);

  // ─────────────────────────────────────────────────────────────
  // 3) Take what the server returned (data?.courses) and apply
  //    client‐side filters: category, level, priceRange, sortByPrice.
  // ─────────────────────────────────────────────────────────────
  const allCourses = data?.courses || [];
  let filteredCourses = [...allCourses];

  // 3a. CATEGORY filter (client‐side)
  if (selectedCategories.length > 0) {
    filteredCourses = filteredCourses.filter((c) =>
      selectedCategories.includes(c.category)
    );
  }

  // 3b. LEVEL filter (client‐side)
  if (selectedLevels.length > 0) {
    // Assume your `course.courseLevel` is “beginner” / “medium” / “advanced”
    filteredCourses = filteredCourses.filter((c) =>
      selectedLevels.includes(c.courseLevel)
    );
  }

  // 3c. PRICE‐RANGE filter (client‐side)
  if (priceRange === "free") {
    filteredCourses = filteredCourses.filter((c) => c.coursePrice === 0);
  } else if (priceRange === "paid") {
    filteredCourses = filteredCourses.filter((c) => c.coursePrice > 0);
  }

  // 3d. SORT‐BY‐PRICE (client‐side fallback)
  if (sortByPrice === "low") {
    filteredCourses.sort((a, b) => a.coursePrice - b.coursePrice);
  } else if (sortByPrice === "high") {
    filteredCourses.sort((a, b) => b.coursePrice - a.coursePrice);
  }

  const isEmpty = !isLoading && filteredCourses.length === 0;

  // 4) Pass all four pieces of state up to <Filter />
  const handleFilterChange = (
    categoriesArr,
    levelsArr,
    priceRangeVal,
    sortByPriceVal
  ) => {
    setSelectedCategories(categoriesArr);
    setSelectedLevels(levelsArr);
    setPriceRange(priceRangeVal);
    setSortByPrice(sortByPriceVal);
  };

  // ─────────────────────────────────────────────────────────────
  // 5) A little helper so that typing into the <input> modifies the URL:
  // ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val) {
      // update only the "query" param
      setSearchParams({ query: val });
    } else {
      // remove the query param if the input is empty
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mt-6">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ─── HEADER WITH SEARCH BAR ───────────────────────────────── */}
        <div className="mb-8 space-y-4">
          {/* 5a) “Persistent” search‐bar bound to `query` */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search courses…"
              value={query}
              onChange={handleInputChange}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <h1 className="font-extrabold text-3xl text-gray-900 dark:text-gray-100">
            Search results for "{query}"
          </h1>

          {isLoading ? (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Looking for courses…
            </p>
          ) : isEmpty ? (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              No courses found.
            </p>
          ) : (
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              Showing {filteredCourses.length} course
              {filteredCourses.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* FILTER SIDEBAR */}
          <Filter handleFilterChange={handleFilterChange} />

          {/* RESULTS AREA */}
          <div className="flex-1 space-y-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <CourseSkeleton key={idx} />
              ))
            ) : isEmpty ? (
              <CourseNotFound />
            ) : (
              filteredCourses.map((course) => (
                <SearchResult key={course._id} course={course} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

// ——— NO COURSES FOUND UI ———
const CourseNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 space-y-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
      <h1 className="font-bold text-2xl text-gray-800 dark:text-gray-200">
        Course Not Found
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Sorry, we couldn't find any courses matching your search.
      </p>
      <Link to="/" className="italic">
        <Button
          variant="link"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Browse All Courses
        </Button>
      </Link>
    </div>
  );
};

// ——— SKELETON LOADING CARD ———
const CourseSkeleton = () => {
  return (
    <div className="animate-pulse flex flex-col md:flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-5 space-x-6">
      <div className="h-32 w-full md:w-64 bg-gray-300 dark:bg-gray-700 rounded-md" />
      <div className="flex-1 flex flex-col gap-3 px-4">
        <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded mt-2" />
      </div>
      <div className="h-6 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
    </div>
  );
};
