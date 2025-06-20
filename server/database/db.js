import mongoose from "mongoose";
import { log, error as logError } from "../utils/logger.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    log("MongoDB Connected");
  } catch (error) {
    logError("error occurred", error);
  }
};
export default connectDB;
