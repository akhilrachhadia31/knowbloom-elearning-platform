import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
    }
  };

  const clearInput = () => {
    setQuery("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label htmlFor="course-search" className="sr-only">
        Search courses
      </label>

      <div className="relative">
        {/* Left-side magnifying glass icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            aria-hidden="true"
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Change here: use type="text" instead of "search" */}
        <input
          id="course-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search courses..."
          className="
            w-full
            bg-gray-100 dark:bg-gray-700
            text-gray-800 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            rounded-full
            py-2.5 pl-10 pr-10
            shadow-sm
            border border-transparent
            focus:outline-none
            transition
            duration-150
            ease-in-out
          "
          aria-label="Search courses"
        />

        {/* Right-side “clear” (X) button, shown only when there’s text */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={clearInput}
            className="
              absolute inset-y-0 right-0 flex items-center pr-3
              text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
              transition-colors duration-150
            "
            aria-label="Clear search input"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Optional: autocomplete / suggestion dropdown placeholder */}
      {/*
        <ul className="mt-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          {suggestions.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                navigate(`/course-detail/${item.id}`);
              }}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
            >
              {item.title}
            </li>
          ))}
        </ul>
      */}
    </div>
  );
};

export default SearchBar;
