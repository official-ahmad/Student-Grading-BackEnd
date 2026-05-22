const express = require("express");
const Student = require("../models/Student");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const {
      search,
      className,
      section,
      status,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    // Search by name or roll number
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by class
    if (className) {
      query.className = className;
    }

    // Filter by section
    if (section) {
      query.section = section;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const students = await Student.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);

    res.json({
      students,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route   GET /api/students/stats
// @desc    Get students statistics
// @access  Private
router.get("/stats", protect, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: "Active" });
    const maleStudents = await Student.countDocuments({ gender: "Male" });
    const femaleStudents = await Student.countDocuments({ gender: "Female" });

    // Get class-wise distribution
    const classDistribution = await Student.aggregate([
      { $group: { _id: "$className", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Get all students to calculate pass rate and average
    const allStudents = await Student.find({});
    let totalPercentage = 0;
    let passCount = 0;

    allStudents.forEach((student) => {
      if (student.subjects && student.subjects.length > 0) {
        const totalObtained = student.subjects.reduce(
          (sum, sub) => sum + sub.obtainedMarks,
          0,
        );
        const totalMarks = student.subjects.reduce(
          (sum, sub) => sum + sub.totalMarks,
          0,
        );
        const percentage =
          totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;
        totalPercentage += percentage;
        if (percentage >= 50) passCount++;
      }
    });

    const averagePercentage =
      allStudents.length > 0
        ? (totalPercentage / allStudents.length).toFixed(2)
        : 0;
    const passRate =
      allStudents.length > 0
        ? ((passCount / allStudents.length) * 100).toFixed(2)
        : 0;

    res.json({
      totalStudents,
      activeStudents,
      maleStudents,
      femaleStudents,
      classDistribution,
      averagePercentage,
      passRate,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route   POST /api/students
// @desc    Create a new student
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const {
      rollNo,
      name,
      fatherName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      className,
      section,
      session,
      subjects,
    } = req.body;

    // Check if roll number already exists
    const existingStudent = await Student.findOne({ rollNo });
    if (existingStudent) {
      return res.status(400).json({ message: "Roll number already exists" });
    }

    const student = new Student({
      rollNo,
      name,
      fatherName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      className,
      section,
      session,
      subjects,
    });

    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route   PUT /api/students/:id
// @desc    Update a student
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if roll number is being updated to an existing one
    if (req.body.rollNo && req.body.rollNo !== student.rollNo) {
      const existingStudent = await Student.findOne({
        rollNo: req.body.rollNo,
      });
      if (existingStudent) {
        return res.status(400).json({ message: "Roll number already exists" });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete a student
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route   PUT /api/students/:id/subjects
// @desc    Update student subjects/marks
// @access  Private
router.put("/:id/subjects", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.subjects = req.body.subjects;
    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route   PUT /api/students/:id/attendance
// @desc    Update student attendance
// @access  Private
router.put("/:id/attendance", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.attendance = req.body.attendance;
    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
