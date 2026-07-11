const jwt = require("jsonwebtoken");

function generateToken(admin) {
  return jwt.sign(
    {
      id: admin._id,
      username: admin.username,
      fullName: admin.fullName,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

module.exports = generateToken;
