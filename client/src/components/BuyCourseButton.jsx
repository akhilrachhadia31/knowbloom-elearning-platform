// src/components/BuyCourseButton.jsx
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCreateCheckoutSessionMutation } from "@/features/api/purchaseApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const BuyCourseButton = ({ courseId }) => {
  const { user } = useSelector((store) => store.auth);
  const [
    createCheckoutSession,
    { data, isLoading, isSuccess, isError, error },
  ] = useCreateCheckoutSessionMutation();

  useEffect(() => {
    if (isSuccess && data) {
      const options = {
        key: data.razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: data.courseTitle,
        image: data.courseThumbnail,
        order_id: data.orderId,
        handler: (response) => {
          toast.success("Payment successful! Redirecting...");
          window.location.href = `/course-progress/${courseId}`;
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        notes: { course_id: courseId },
        theme: { color: "#3399cc" },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (err) => {
        console.error(err);
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    }

    if (isError) {
      toast.error(error?.data?.message || "Failed to initiate payment");
    }
  }, [isSuccess, isError]);

  const handleBuy = () => {
    if (!user) {
      toast.error("Please login to purchase this course.");
      return;
    }
    // Send { courseId } as the body, not just the ID
    createCheckoutSession({ courseId });
  };

  return (
    <Button onClick={handleBuy} disabled={isLoading} className="w-full">
      {isLoading ? "Processing..." : "Buy Now"}
    </Button>
  );
};

export default BuyCourseButton;
