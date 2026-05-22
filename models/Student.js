const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 100,
  },
  obtainedMarks: {
    type: Number,
    required: true,
    default: 0,
  },
});

const studentSchema = new mongoose.Schema(
  {
    rollNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },
    address: {
      type: String,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
      default: "A",
    },
    session: {
      type: String,
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    subjects: [subjectSchema],
    attendance: {
      totalDays: {
        type: Number,
        default: 0,
      },
      presentDays: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Graduated", "Expelled"],
      default: "Active",
    },
    profileImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for calculating percentage
studentSchema.virtual("percentage").get(function () {
  if (!this.subjects || this.subjects.length === 0) return 0;
  const totalObtained = this.subjects.reduce(
    (sum, sub) => sum + sub.obtainedMarks,
    0,
  );
  const totalMarks = this.subjects.reduce(
    (sum, sub) => sum + sub.totalMarks,
    0,
  );
  return totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : 0;
});

// Virtual for grade
studentSchema.virtual("grade").get(function () {
  const percentage = this.percentage;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
});

// Virtual for pass/fail status
studentSchema.virtual("result").get(function () {
  return this.percentage >= 50 ? "Pass" : "Fail";
});

studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
