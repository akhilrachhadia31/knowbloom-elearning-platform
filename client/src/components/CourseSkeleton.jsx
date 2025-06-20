import React from "react";

const CourseSkeleton = () => {
  return (
    <div className="overflow-hidden aspect-[1/1] w-full max-w-xs flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
      <div className="aspect-[1.7/1] w-full bg-gray-300 dark:bg-gray-700" />
      <div className="flex flex-col flex-1 justify-between px-4 pt-2 pb-3 space-y-3">
        <div className="h-5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-auto">
          <div className="h-6 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-7 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
};

export default CourseSkeleton;
