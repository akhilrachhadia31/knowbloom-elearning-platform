// src/models/lecture.model.js

import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  questions: { type: [QuestionSchema], default: [] },
});

// Your existing LectureSchema — we only append a `quiz` field at the end:
const LectureSchema = new mongoose.Schema(
  {
    lectureTitle: { type: String, required: true },
    videoUrl: { type: String, default: "" },
    publicId: { type: String, default: "" },
    preview: { type: Boolean, default: false },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
    duration: { type: Number, default: 0 },

    // ── ADD THIS BLOCK ──
    quiz: {
      type: QuizSchema,
      default: { title: "", questions: [] },
    },
    // ────────────────────
  },
  { timestamps: true }
);

export const Lecture = mongoose.model("Lecture", LectureSchema);
