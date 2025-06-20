// server/app.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import connectDB from "./database/db.js";
import { log } from "./utils/logger.js";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRouter from "./routes/purchaseCourse.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import passport from "passport";
import session from "express-session";
import helmet from "helmet";
import "./passport.js";
import history from "connect-history-api-fallback";
import contactRouter from "./routes/contact.route.js";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for secure cookies
app.set("trust proxy", 1);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://knowbloom.onrender.com",
    credentials: true,
  })
);

// JSON / URL-encoded parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security headers
app.use(helmet());

// Session & Passport
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "none",
      secure: true,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Debug log
app.use((req, res, next) => {
  log(
    `${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`
  );
  next();
});

// Mount routes
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRouter);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/v1/contact", contactRouter); 

// SPA fallback + static
const __dirname = path.resolve();
app.use(
  history({
    index: "/index.html",
    verbose: true,
  })
);
app.use(express.static(path.join(__dirname, "../client/dist")));

// Global error handlers
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ message: "Something went wrong", code: "SERVER_ERROR" });
});
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  log(`🚀 Server running on port ${PORT}`);
});
