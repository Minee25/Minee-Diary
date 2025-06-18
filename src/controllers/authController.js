const bcrypt = require("bcrypt");
const db = require("../database/configDb");
const jwt = require("jsonwebtoken");

module.exports.signin = (req, res) => {
  const locals = {
    title: "Login | DiaryApp",
    description: "Node App",
    header: "Page header",
    layout: 'layouts/auth'
  }
  res.render("signin", locals);
}

module.exports.signup = (req, res) => {
  const locals = {
    title: "Signup | DiaryApp",
    description: "Node App",
    header: "Page header",
    layout: "layouts/auth"
  }
  res.render("signup", locals);
}

module.exports.signupPost = async (req, res) => {
  try {
    const { username, password, confirm_password } = req.body;

    // Validate
    if (!username || !password || !confirm_password) {
      return res.status(400).send("Missing required fields.");
    }
    if (password !== confirm_password) {
      return res.status(400).send("Passwords do not match.");
    }

    const existingUser = await new Promise((resolve, reject) => {
      db.get("SELECT username FROM users WHERE username = ? COLLATE NOCASE", [username], (err, row) => {
        if (err) { reject(err) }
        else { resolve(row) }
      });
    });

    if (existingUser) {
      return res.status(409).send("Username already exists.");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);

    // Insert
    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO users (username, display_name, password) VALUES (?, ?, ?)",
        [username.toLowerCase(), username, passwordHashed],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });

    console.log(`User ${username} registered successfully`);
    res.redirect("/auth/signin");
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Internal server error")
  }
}

module.exports.signinPost = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).send("กรุณากรอกชื่อผู้ใช้");
    }
    if (!password) {
      return res.status(400).send("กรุณากรอกรหัสผ่าน");
    }

    // Find user in database
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT id, username, password FROM users WHERE username = ? COLLATE NOCASE", [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Check if user exists
    if (!user) {
      return res.status(401).send("ไม่พบผู้ใช้")
    }

    const idPasswordValid = await bcrypt.compare(password, user.password);
    if (!idPasswordValid) {
      return res.status(401).send("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      process.env.JWT_SECRET || "jwt_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3600000
    });

    console.log(`User ${username} signed in successfully`);
    res.redirect("/diary");
  } catch (err) {
    console.log("Signup error:", err);
    res.status(500).send("Internal server error");
  }
}

module.exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
}

module.exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
    }

    // Get current user's password from database
    const user = await new Promise((resolve, reject) => {
      const sql = "SELECT password FROM users WHERE id = ?";
      db.get(sql, [req.user.userId], (err, row) => {
        if (err) {
          console.error("Error fetching user:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await new Promise((resolve, reject) => {
      const sql = "UPDATE users SET password = ? WHERE id = ?";
      db.run(sql, [hashedPassword, req.user.userId], function (err) {
        if (err) {
          console.error("Error updating password:", err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" });
  }
}

module.exports.changeDisplayName = async (req, res) => {
  try {
    const { newDisplayName } = req.body;

    if (!newDisplayName) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
    }

    // Check if displayname already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get("SELECT display_name FROM users WHERE display_name = ? COLLATE NOCASE AND id != ?", [newDisplayName, req.user.userId], (err, row) => {
        if (err) {
          console.error("Error checking display name:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (existingUser) {
      return res.status(409).json({ message: "ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว" });
    }

    // Update display name in database
    await new Promise((resolve, reject) => {
      const sql = "UPDATE users SET display_name = ? WHERE id = ?";
      db.run(sql, [newDisplayName, req.user.userId], function (err) {
        if (err) {
          console.error("Error updating display_name:", err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    }); 

    res.json({ message: "เปลี่ยนชื่อผู้ใช้สำเร็จ" });
  } catch (err) {
    console.error("Error in change display name:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเปลี่ยนชื่อผู้ใช้" });
  }
}