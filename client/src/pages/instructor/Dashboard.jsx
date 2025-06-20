import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetPurchasedCoursesQuery } from "@/features/api/purchaseApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import LoadingScreen from "@/loadingscreen";

const Dashboard = () => {
  const { data, isSuccess, isError, isLoading } = useGetPurchasedCoursesQuery();

  // Initialize displayRevenue from localStorage on first render
  const [displayRevenue, setDisplayRevenue] = useState(() => {
    const stored = parseFloat(localStorage.getItem("previousRevenue"));
    return isNaN(stored) ? 0 : stored;
  });

  // Safely grab purchasedCourse, defaulting to []
  const purchasedCourse = data?.purchasedCourse ?? [];

  // Metrics
  const totalSales = purchasedCourse.length;
  const uniqueCoursesSold = useMemo(
    () => new Set(purchasedCourse.map((el) => el.courseId?._id)).size,
    [purchasedCourse]
  );

  const avgSale = totalSales > 0 ? displayRevenue / totalSales : 0;

  // Chart data
  const courseData = useMemo(
    () =>
      purchasedCourse.map((el) => ({
        name: el.courseId?.courseTitle ?? "Untitled",
        price: el.courseId?.coursePrice ?? 0,
      })),
    [purchasedCourse]
  );

  // Whenever fetched data changes, update displayRevenue only if there's a new positive total
  useEffect(() => {
    if (isSuccess) {
      // Compute new totalRevenue from fetched data
      const newTotalRevenue = purchasedCourse.reduce(
        (acc, element) => acc + (element.amount || 0),
        0
      );
      const prevRevenue =
        parseFloat(localStorage.getItem("previousRevenue")) || 0;
      const maxRevenue = Math.max(prevRevenue, newTotalRevenue);

      setDisplayRevenue(maxRevenue);
      localStorage.setItem("previousRevenue", maxRevenue.toString());
    }
  }, [purchasedCourse, isSuccess]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  // Early returns BELOW all hooks
  if (isLoading)
    return (
      <LoadingScreen/>
    );
  if (isError)
    return (
      <div className="text-red-500 dark:text-red-400">
        Failed to load purchased courses.
      </div>
    );

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-6">
      {/* Total Sales */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Total Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{totalSales}</p>
        </CardContent>
      </Card>
      {/* Courses Sold */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Courses Sold
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">
            {uniqueCoursesSold}
          </p>
        </CardContent>
      </Card>
      {/* Total Revenue */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(displayRevenue)}
          </p>
        </CardContent>
      </Card>
      {/* Avg. Sale Value */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Avg. Sale Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-600">
            {formatCurrency(avgSale)}
          </p>
        </CardContent>
      </Card>
      {/* Course Prices Chart */}
      <Card className="lg:col-span-4 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Course Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={courseData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={(value) => [formatCurrency(value), "Price"]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#4a90e2"
                strokeWidth={3}
                dot={{ stroke: "#4a90e2", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
