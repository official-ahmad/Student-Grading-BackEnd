require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

async function resetAdmin() {
  const { MONGO_URI, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error("MONGO_URI, ADMIN_USERNAME, and ADMIN_PASSWORD must be set in .env");
  }

  await mongoose.connect(MONGO_URI);

  // Match /api/admin/setup: bcryptjs with a generated 10-round salt.
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

  await Admin.findOneAndUpdate(
    { username: ADMIN_USERNAME },
    { $set: { username: ADMIN_USERNAME, password: hashedPassword } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  console.log(`Admin account "${ADMIN_USERNAME}" was created or updated successfully.`);
}

resetAdmin()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Failed to reset admin account:", error.message);
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exit(1);
  });
