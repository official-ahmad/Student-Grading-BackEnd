const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./connect");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

connectDB();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://student-grading-frontend.vercel.app",
  "https://student-grading-front-end.vercel.app",
  "https://student-grading-front-fgea05txd-dev-ahmad-516s-projects.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(express.json());
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/", (req, res) => {
  res.send("Student Grading System API is running");
});

const PORT = process.env.PORT || 8004;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
