// Test script to setup admin and add student data
require("dotenv").config();
const axios = require("axios");

const API_URL = process.env.API_URL || "http://localhost:8000/api";
const adminCredentials = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
};

async function setupTestData() {
  try {
    if (!adminCredentials.username || !adminCredentials.password) {
      throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env");
    }

    console.log("Setting up test data...\n");

    // 1. Create the configured admin, or log in if it already exists.
    console.log("1. Getting admin account...");
    let adminRes;
    try {
      adminRes = await axios.post(`${API_URL}/admin/setup`, adminCredentials);
    } catch (error) {
      if (error.response?.status !== 400) throw error;
      adminRes = await axios.post(`${API_URL}/admin/login`, adminCredentials);
    }
    const adminToken = adminRes.data.token;
    console.log("Admin account is ready.");
    console.log(`   Username: ${adminCredentials.username}\n`);

    const headers = { Authorization: `Bearer ${adminToken}` };

    // 2. Add test students with marks
    console.log("2. Adding test students...");

    const students = [
      {
        rollNo: "001",
        name: "Ali Ahmed",
        fatherName: "Ahmed Khan",
        email: "ali@example.com",
        phone: "03001234567",
        gender: "Male",
        className: "9-A",
        section: "A",
        session: "2024",
        subjects: [
          { name: "English", totalMarks: 100, obtainedMarks: 92 },
          { name: "Mathematics", totalMarks: 100, obtainedMarks: 88 },
          { name: "Science", totalMarks: 100, obtainedMarks: 95 },
        ],
        attendance: { totalDays: 100, presentDays: 95 },
        status: "Active",
      },
      {
        rollNo: "002",
        name: "Fatima Khan",
        fatherName: "Khan Ali",
        email: "fatima@example.com",
        phone: "03001234568",
        gender: "Female",
        className: "9-A",
        section: "A",
        session: "2024",
        subjects: [
          { name: "English", totalMarks: 100, obtainedMarks: 75 },
          { name: "Mathematics", totalMarks: 100, obtainedMarks: 45 },
          { name: "Science", totalMarks: 100, obtainedMarks: 55 },
        ],
        attendance: { totalDays: 100, presentDays: 60 },
        status: "Active",
      },
      {
        rollNo: "003",
        name: "Hassan Raza",
        fatherName: "Raza Ahmed",
        email: "hassan@example.com",
        phone: "03001234569",
        gender: "Male",
        className: "9-B",
        section: "B",
        session: "2024",
        subjects: [
          { name: "English", totalMarks: 100, obtainedMarks: 32 },
          { name: "Mathematics", totalMarks: 100, obtainedMarks: 28 },
          { name: "Science", totalMarks: 100, obtainedMarks: 35 },
        ],
        attendance: { totalDays: 100, presentDays: 40 },
        status: "Active",
      },
      {
        rollNo: "004",
        name: "Ayesha Malik",
        fatherName: "Malik Hassan",
        email: "ayesha@example.com",
        phone: "03001234570",
        gender: "Female",
        className: "9-B",
        section: "B",
        session: "2024",
        subjects: [
          { name: "English", totalMarks: 100, obtainedMarks: 82 },
          { name: "Mathematics", totalMarks: 100, obtainedMarks: 78 },
          { name: "Science", totalMarks: 100, obtainedMarks: 85 },
        ],
        attendance: { totalDays: 100, presentDays: 92 },
        status: "Active",
      },
    ];

    for (const student of students) {
      try {
        await axios.post(`${API_URL}/students`, student, { headers });
        console.log(`   ✅ ${student.name} added (Roll: ${student.rollNo})`);
      } catch (err) {
        if (err.response?.status === 400) {
          console.log(
            `   ⚠️  ${student.name} already exists (Roll: ${student.rollNo})`,
          );
        } else {
          throw err;
        }
      }
    }

    console.log("\n✅ Test data setup completed!");
    console.log("\nYou can now login with:");
    console.log("  Use ADMIN_USERNAME and ADMIN_PASSWORD from .env");
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

setupTestData();
