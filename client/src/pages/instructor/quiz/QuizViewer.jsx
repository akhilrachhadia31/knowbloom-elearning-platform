import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useGetLectureQuizQuery } from "@/features/api/courseApi";

export default function QuizViewer({
  courseId,
  moduleId,
  lectureId,
  onClose,
  isInstructor = false,
}) {
  // 1) Fetch the quiz
  const {
    data: quiz,
    isLoading,
    isError,
  } = useGetLectureQuizQuery({
    courseId,
    moduleId,
    lectureId,
  });

  // 2) Local state: student's selected answers (index = questionIdx)
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  // 3) Local state: which question index is currently shown
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // 4) Local state: whether quiz has been "started" or, for instructors, immediate
  const [started, setStarted] = useState(false);

  // 5) Local state: whether student has submitted (so we can show the summary view)
  const [submitted, setSubmitted] = useState(false);

  // 6) Local state: computed score once submitted
  const [score, setScore] = useState(0);

  // 7) On mount or when lectureId changes, check for any stored attempt in localStorage
  useEffect(() => {
    if (!isLoading && quiz) {
      const stored = localStorage.getItem(`quizAttempt_${lectureId}`);
      if (stored) {
        try {
          const { selectedAnswers: storedAnswers, score: storedScore } =
            JSON.parse(stored);
          setSelectedAnswers(storedAnswers);
          setScore(storedScore);
          setSubmitted(true);
          setStarted(true);
        } catch {
          // If parsing fails, just initialize fresh
          setSelectedAnswers(quiz.questions.map(() => -1));
          setSubmitted(false);
          setScore(0);
          if (isInstructor) {
            setStarted(true);
          }
        }
      } else {
        setSelectedAnswers(quiz.questions.map(() => -1));
        setSubmitted(false);
        setScore(0);
        if (isInstructor) {
          setStarted(true);
        }
      }
      setCurrentQuestionIdx(0);
    }
  }, [isLoading, quiz, isInstructor, lectureId]);

  // 8) Loading / error / no-quiz checks
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className=" animate-pulse rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">Error loading quiz</p>
          <p className="text-gray-500 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            No quiz available for this lecture
          </p>
        </div>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentQuestionIdx];

  // 9) Handler: begin quiz
  const handleStart = () => {
    setStarted(true);
    setSubmitted(false);
    setCurrentQuestionIdx(0);
  };

  // 10) Handler: select an option
  const handleSelect = (optIdx) => {
    if (submitted) return;
    setSelectedAnswers((prev) =>
      prev.map((val, idx) => (idx === currentQuestionIdx ? optIdx : val))
    );
  };

  // 11) Handler: navigate to previous question
  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((idx) => idx - 1);
    }
  };

  // 12) Handler: navigate to next question
  const handleNext = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx((idx) => idx + 1);
    }
  };

  // 13) Handler: show summary (upon submission)
  const handleSubmit = () => {
    // ensure every question has an answer
    if (selectedAnswers.some((ans) => ans < 0)) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    // compute score
    const numCorrect = quiz.questions.reduce((sum, q, idx) => {
      return sum + (q.correctOptionIndex === selectedAnswers[idx] ? 1 : 0);
    }, 0);
    setScore(numCorrect);
    setSubmitted(true);

    // store in localStorage so that reloading or navigating back only shows summary
    const payload = {
      selectedAnswers,
      score: numCorrect,
    };
    localStorage.setItem(`quizAttempt_${lectureId}`, JSON.stringify(payload));
  };

  // 14) Handler: retry quiz
  const handleRetry = () => {
    // clear stored attempt first
    localStorage.removeItem(`quizAttempt_${lectureId}`);
    // reset local states
    setSelectedAnswers(quiz.questions.map(() => -1));
    setSubmitted(false);
    setScore(0);
    setCurrentQuestionIdx(0);
    setStarted(true);
  };

  // 15) RENDER: if not started yet (and not submitted), show "Start" screen
  if (!started && !submitted) {
    return (
      <div className="h-full flex flex-col justify-center items-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {quiz.title || "Quiz"}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {quiz.questions.length} question
            {quiz.questions.length > 1 ? "s" : ""}
          </p>
          {quiz.description && (
            <p className="text-gray-700 dark:text-gray-200 mb-2 leading-relaxed">
              {quiz.description}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStart}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Start Quiz
            </button>
            {typeof onClose === "function" && (
              <button
                onClick={onClose}
                className="px-8 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
              >
                Skip Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 16) RENDER: if submitted, show summary view with only incorrect questions
  if (submitted) {
    const numWrong = totalQuestions - score;
    const incorrectQuestions = quiz.questions.filter(
      (_, idx) =>
        selectedAnswers[idx] !== quiz.questions[idx].correctOptionIndex
    );

    return (
      <div className="h-full flex flex-col p-6">
        <div className="text-center mb-2">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quiz Complete!
          </h2>
          <div className="flex justify-center gap-8 mb-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {score}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Correct
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {numWrong}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Wrong
              </div>
            </div>
          </div>
        </div>

        {numWrong > 0 && (
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Review Incorrect Answers
            </h3>
            <div className="space-y-4">
              {incorrectQuestions.map((q, qIdxInFiltered) => {
                // Find the original index of this question
                const originalIdx = quiz.questions.findIndex(
                  (origQ) => origQ.questionText === q.questionText
                );
                const studentAnswerIdx = selectedAnswers[originalIdx];
                const correctIdx = q.correctOptionIndex;

                return (
                  <div
                    key={originalIdx}
                    className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20"
                  >
                    <p className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">
                      {originalIdx + 1}. {q.questionText}
                    </p>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <svg
                          className="w-5 h-5"
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
                        Your answer:{" "}
                        <span className="font-medium">
                          {q.options[studentAnswerIdx]}
                        </span>
                      </p>
                      <p className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Correct answer:{" "}
                        <span className="font-medium">
                          {q.options[correctIdx]}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Retry Quiz
          </button>
          {typeof onClose === "function" && (
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  // 17) RENDER: quiz in progress, one question at a time
  const studentAnswer = selectedAnswers[currentQuestionIdx];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {quiz.title || "Quiz"}
          </h2>
          <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full">
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              {currentQuestionIdx + 1} of {totalQuestions}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 leading-relaxed">
          {currentQuestionIdx + 1}. {currentQuestion.questionText}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((opt, optIdx) => (
            <label
              key={optIdx}
              className={`flex items-center cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                studentAnswer === optIdx
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10"
              }`}
            >
              <input
                type="radio"
                name={`q-${currentQuestionIdx}`}
                value={optIdx}
                checked={studentAnswer === optIdx}
                onChange={() => handleSelect(optIdx)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  studentAnswer === optIdx
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {studentAnswer === optIdx && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span className="ml-4 text-gray-900 dark:text-white font-medium">
                {opt}
              </span>
            </label>
          ))}
        </div>
        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIdx === 0}
            className={`px-3 py-3 rounded-xl font-semibold transition-all duration-200 ${
              currentQuestionIdx === 0
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md hover:shadow-lg"
            }`}
          >
            Previous
          </button>

          {currentQuestionIdx < totalQuestions - 1 ? (
            <button
              onClick={handleNext}
              disabled={studentAnswer < 0}
              className={`px-3 py-3 rounded-xl font-semibold transition-all duration-200 ${
                studentAnswer < 0
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={studentAnswer < 0}
              className={`px-3 py-3 rounded-xl font-semibold transition-all duration-200 ${
                studentAnswer < 0
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
