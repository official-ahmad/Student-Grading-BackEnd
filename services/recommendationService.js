const Student = require("../models/Student");

const generateRecommendations = async () => {
  try {
    const students = await Student.find({});
    const recommendations = [];

    for (const student of students) {
      if (!student.subjects || student.subjects.length === 0) continue;

      const analysis = analyzeStudentPerformance(student);
      const recs = generatePersonalizedRecommendations(analysis, student);

      recommendations.push({
        studentId: student._id,
        name: student.name,
        rollNo: student.rollNo,
        className: student.className,
        percentage: analysis.percentage,
        grade: student.grade,
        riskLevel: analysis.riskLevel,
        recommendations: recs,
        lastUpdated: new Date(),
      });
    }

    return recommendations;
  } catch (error) {
    throw new Error("Error generating recommendations: " + error.message);
  }
};

const analyzeStudentPerformance = (student) => {
  if (!student.subjects || student.subjects.length === 0) {
    return {
      percentage: 0,
      riskLevel: "Critical",
      averageMarks: 0,
      lowestSubject: null,
      highestSubject: null,
      subjectVariance: 0,
    };
  }

  const totalObtained = student.subjects.reduce(
    (sum, sub) => sum + sub.obtainedMarks,
    0,
  );
  const totalMarks = student.subjects.reduce(
    (sum, sub) => sum + sub.totalMarks,
    0,
  );
  const percentage = totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;

  const subjectPercentages = student.subjects.map((sub) => ({
    name: sub.name,
    percentage: (sub.obtainedMarks / sub.totalMarks) * 100,
    obtained: sub.obtainedMarks,
  }));

  const averageSubjectPercentage =
    subjectPercentages.reduce((sum, sub) => sum + sub.percentage, 0) /
    subjectPercentages.length;
  const variance =
    subjectPercentages.reduce(
      (sum, sub) =>
        sum + Math.pow(sub.percentage - averageSubjectPercentage, 2),
      0,
    ) / subjectPercentages.length;

  const lowestSubject = subjectPercentages.reduce((min, sub) =>
    sub.percentage < min.percentage ? sub : min,
  );
  const highestSubject = subjectPercentages.reduce((max, sub) =>
    sub.percentage > max.percentage ? sub : max,
  );

  const attendancePercentage = student.attendance?.totalDays
    ? (student.attendance.presentDays / student.attendance.totalDays) * 100
    : 0;

  const riskLevel = determineRiskLevel(
    percentage,
    variance,
    attendancePercentage,
  );

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    riskLevel,
    averageMarks: parseFloat(averageSubjectPercentage.toFixed(2)),
    lowestSubject,
    highestSubject,
    subjectVariance: parseFloat(Math.sqrt(variance).toFixed(2)),
    attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
    totalSubjects: student.subjects.length,
  };
};

const determineRiskLevel = (percentage, variance, attendance) => {
  if (percentage < 40 || attendance < 50) return "Critical";
  if (percentage < 50 || attendance < 70) return "High";
  if (percentage < 60 || variance > 20) return "Medium";
  if (percentage < 75) return "Low";
  return "Excellent";
};

const generatePersonalizedRecommendations = (analysis, student) => {
  const recommendations = [];

  if (analysis.riskLevel === "Critical") {
    recommendations.push({
      type: "urgent",
      title: "Critical Performance Alert",
      message: `Performance is below 40%. Immediate intervention required.`,
      actionItems: [
        "Schedule parent-teacher meeting",
        "Provide extra tutoring sessions",
        "Monitor daily progress",
      ],
    });
  }

  if (
    analysis.lowestSubject &&
    analysis.lowestSubject.percentage < analysis.averageMarks - 10
  ) {
    recommendations.push({
      type: "subject-focus",
      title: `Focus on ${analysis.lowestSubject.name}`,
      message: `Performance in ${analysis.lowestSubject.name} is significantly below average (${analysis.lowestSubject.percentage.toFixed(2)}%).`,
      actionItems: [
        `Take extra classes in ${analysis.lowestSubject.name}`,
        "Practice more questions on weak topics",
        "Form study groups",
      ],
    });
  }

  if (analysis.attendancePercentage && analysis.attendancePercentage < 75) {
    recommendations.push({
      type: "attendance",
      title: "Attendance Improvement Needed",
      message: `Current attendance is ${analysis.attendancePercentage.toFixed(2)}%. Regular attendance is crucial for better performance.`,
      actionItems: [
        "Improve daily attendance",
        "Inform about important classes",
        "Contact parents if absence continues",
      ],
    });
  }

  if (analysis.subjectVariance > 20) {
    recommendations.push({
      type: "consistency",
      title: "Inconsistent Performance",
      message: `Performance varies significantly across subjects. Focus on building consistent skills.`,
      actionItems: [
        "Create balanced study schedule",
        "Strengthen weaker areas",
        "Practice regularly",
      ],
    });
  }

  if (analysis.percentage >= 75 && analysis.percentage < 90) {
    recommendations.push({
      type: "improvement",
      title: "Good Performance - Aim Higher",
      message: `Current performance is good. With focused effort, you can achieve excellence.`,
      actionItems: [
        "Practice advanced topics",
        "Solve previous year papers",
        "Set goal to score above 85%",
      ],
    });
  }

  if (analysis.percentage >= 90) {
    recommendations.push({
      type: "excellence",
      title: "Excellent Performance! 🌟",
      message: `Outstanding performance! Keep up the excellent work.`,
      actionItems: [
        "Help peers in studies",
        "Participate in competitions",
        "Explore advanced topics",
      ],
    });
  }

  return recommendations.length > 0
    ? recommendations
    : [
        {
          type: "general",
          title: "Keep Progressing",
          message: "Continue your studies with dedication and focus.",
          actionItems: [
            "Regular study routine",
            "Ask teachers for help",
            "Practice daily",
          ],
        },
      ];
};

const getStudentRecommendations = async (studentId) => {
  try {
    const student = await Student.findById(studentId);
    if (!student) throw new Error("Student not found");

    const analysis = analyzeStudentPerformance(student);
    const recommendations = generatePersonalizedRecommendations(
      analysis,
      student,
    );

    return {
      student: {
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        className: student.className,
      },
      analysis,
      recommendations,
    };
  } catch (error) {
    throw new Error("Error fetching recommendations: " + error.message);
  }
};

module.exports = {
  generateRecommendations,
  analyzeStudentPerformance,
  generatePersonalizedRecommendations,
  getStudentRecommendations,
};
