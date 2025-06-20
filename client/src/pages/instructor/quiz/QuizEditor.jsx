// src/pages/instructor/quiz/QuizEditor.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Logo from "@/components/Logo";

import {
  useGetLectureQuizQuery,
  useSetLectureQuizMutation,
  useRemoveLectureQuizMutation,
} from "@/features/api/courseApi";

const QuizEditor = () => {
  const navigate = useNavigate();
  const { courseId, moduleId, lectureId } = useParams();

  const {
    data: fetchedQuiz,
    isLoading: quizLoading,
    isError: quizError,
  } = useGetLectureQuizQuery(
    { courseId, moduleId, lectureId },
    { skip: !courseId || !moduleId || !lectureId }
  );

  const [
    setLectureQuiz,
    {
      isLoading: setQuizLoading,
      isSuccess: setQuizSuccess,
      error: setQuizError,
    },
  ] = useSetLectureQuizMutation();

  const [
    removeLectureQuiz,
    { isLoading: removeLoading, isSuccess: removeSuccess, error: removeError },
  ] = useRemoveLectureQuizMutation();

  const [questions, setQuestions] = useState([
    { questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 },
  ]);

  useEffect(() => {
    if (fetchedQuiz && Array.isArray(fetchedQuiz.questions)) {
      const mapped = fetchedQuiz.questions.map((q) => ({
        questionText: q.questionText || "",
        options:
          Array.isArray(q.options) && q.options.length === 4
            ? q.options
            : ["", "", "", ""],
        correctOptionIndex:
          typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0,
      }));
      setQuestions(
        mapped.length > 0
          ? mapped
          : [
              {
                questionText: "",
                options: ["", "", "", ""],
                correctOptionIndex: 0,
              },
            ]
      );
    }
  }, [fetchedQuiz]);

  useEffect(() => {
    if (setQuizSuccess) {
      toast.success("Quiz saved successfully!");
    }
    if (setQuizError) toast.error("Failed to save quiz.");
  }, [setQuizSuccess, setQuizError, navigate, courseId, moduleId]);

  useEffect(() => {
    if (removeSuccess) {
      toast.success("Quiz removed.");
      navigate(`/instructor/course/${courseId}/module/${moduleId}`);
    }
    if (removeError) toast.error("Failed to remove quiz.");
  }, [removeSuccess, removeError, navigate, courseId, moduleId, lectureId]);

  const saveQuizHandler = async () => {
    if (questions.length === 0) {
      toast.error("You must add at least one question.");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1}: text cannot be empty.`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        toast.error(`Question ${i + 1}: all options must be filled out.`);
        return;
      }
      if (q.correctOptionIndex < 0 || q.correctOptionIndex > 3) {
        toast.error(`Question ${i + 1}: select a valid correct answer.`);
        return;
      }
    }
    const payload = {
      title: "",
      questions: questions.map((q) => ({
        questionText: q.questionText.trim(),
        options: q.options.map((o) => o.trim()),
        correctOptionIndex: q.correctOptionIndex,
      })),
    };
    try {
      await setLectureQuiz({
        courseId,
        moduleId,
        lectureId,
        ...payload,
      }).unwrap();
    } catch (err) {
      console.error("setLectureQuiz error", err);
    }
  };

  const removeQuizHandler = async () => {
    try {
      await removeLectureQuiz({ courseId, moduleId, lectureId }).unwrap();
    } catch (err) {
      console.error("removeLectureQuiz error", err);
    }
  };

  if (!courseId || !moduleId || !lectureId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error: missing route parameters</p>
      </div>
    );
  }
  if (quizLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen"></div>
    );
  }
  if (quizError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error loading quiz.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center space-x-1 text-sm text-gray-400 mb-4">
        <Link to="/instructor/course" className="hover:text-gray-700">
          Courses
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          to={`/instructor/course/${courseId}`}
          className="hover:text-gray-700"
        >
          Course Details
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          to={`/instructor/course/${courseId}/module`}
          className="hover:text-gray-700"
        >
          Add Module
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          to={`/instructor/course/${courseId}/module/${moduleId}`}
          className="hover:text-gray-700"
        >
          Edit Module
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          to={`/instructor/course/${courseId}/module/${moduleId}/lecture/${lectureId}/quiz`}
          className="hover:text-gray-700"
        >
          Edit Quiz
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Quiz Editor</h1>
      <div className="mb-4">
        <Button
          onClick={() =>
            setQuestions((prev) => [
              ...prev,
              {
                questionText: "",
                options: ["", "", "", ""],
                correctOptionIndex: 0,
              },
            ])
          }
          size="sm"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusCircle className="w-4 h-4" />
          Add Question
        </Button>
      </div>
      {questions.map((q, qIdx) => (
        <div
          key={qIdx}
          className="mb-8 border border-gray-300 dark:border-gray-700 rounded-lg p-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Question {qIdx + 1}</h2>
            {questions.length > 1 && (
              <button
                onClick={() =>
                  setQuestions((prev) => prev.filter((_, idx) => idx !== qIdx))
                }
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor={`questionText-${qIdx}`} className="block mb-1">
              Question Text
            </Label>
            <Input
              id={`questionText-${qIdx}`}
              type="text"
              value={q.questionText}
              onChange={(e) => {
                const updated = [...questions];
                updated[qIdx].questionText = e.target.value;
                setQuestions(updated);
              }}
              placeholder="Enter question"
              className="w-full"
            />
          </div>
          <div className="mb-4 space-y-2">
            <Label className="block mb-1">Options</Label>
            {q.options.map((opt, optIdx) => (
              <Input
                key={optIdx}
                type="text"
                value={opt}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[qIdx].options[optIdx] = e.target.value;
                  setQuestions(updated);
                }}
                placeholder={`Option ${optIdx + 1}`}
                className="w-full"
              />
            ))}
          </div>
          <div className="mb-2">
            <Label className="block mb-1">Correct Answer</Label>
            <div className="flex gap-6">
              {q.options.map((_, optIdx) => (
                <label key={optIdx} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correctIndex-${qIdx}`}
                    checked={q.correctOptionIndex === optIdx}
                    onChange={() => {
                      const updated = [...questions];
                      updated[qIdx].correctOptionIndex = optIdx;
                      setQuestions(updated);
                    }}
                  />
                  <span>Option {optIdx + 1}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-4 items-center">
        <Button
          onClick={saveQuizHandler}
          disabled={setQuizLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
        >
          {setQuizLoading ? (
            <span className="text-lg font-bold">Updating...</span>
          ) : fetchedQuiz ? (
            "Update Quiz"
          ) : (
            "Create Quiz"
          )}
        </Button>
        {fetchedQuiz && (
          <Button
            variant="destructive"
            onClick={removeQuizHandler}
            disabled={removeLoading}
            className="flex items-center gap-2"
          >
            {removeLoading ? (
              <span className="text-lg font-bold">Removing...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" /> Remove Quiz
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizEditor;
