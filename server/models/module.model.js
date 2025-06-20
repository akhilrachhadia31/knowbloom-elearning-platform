// src/models/module.model.js

import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    moduleTitle: { type: String, required: true },
    lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  { timestamps: true }
);

export const Module = mongoose.model("Module", moduleSchema);
