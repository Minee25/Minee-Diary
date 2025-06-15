const db = require("../database/configDb");
const bcrypt = require("bcrypt");

exports.home = (req, res) => {
  const locals = {
    title: "Diary App",
    description: "Diary App",
    header: "Page header",
    layout: 'layouts/main',
    user: req.user
  }
  res.render("index", locals);
}

exports.users = async (req, res) => {
  const locals = {
    title: "Diary App",
    description: "Diary App",
    header: "Page header",
    layout: 'layouts/main'
  }

  try {
    const rows = await new Promise((resolve, reject) => {
      const sql = "SELECT * FROM users ORDER BY created_at DESC";
      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error("Error fetching users:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    locals.users = rows;
    res.render("users", locals);
  } catch (err) {
    console.error("Error in users controller:", err);
    res.status(500).send("Error fetching users");
  }
}

module.exports.profile = async (req, res) => {
  const locals = {
    title: `${req.user.username} - Diary App`,
    description: "User Profile",
    header: "Profile",
    layout: 'layouts/main',
    user: req.user
  }

  try {
    const userData = await new Promise((resolve, reject) => {
      const sql = "SELECT id, username, display_name, created_at FROM users WHERE id = ?";
      db.get(sql, [req.user.userId], (err, row) => {
        if (err) {
          console.error("Error fetching user data:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!userData) {
      return res.status(404).send("User not found");
    }

    locals.userData = userData;
    res.render("profile", locals);
  } catch (err) {
    console.error("Error in profile controller:", err);
    res.status(500).send("Error fetching profile data");
  }
}

module.exports.createDiary = async (req, res) => {
  try {
    const locals = {
      title: `${req.user.username} - Diary App`,
      description: "User Profile",
      header: "Profile",
      layout: 'layouts/main',
      user: req.user
    }
    res.render("diary", locals);
  } catch (err) {
    console.error("Error in create diary cotroller:", err);
    res.status(500).send("Error in create diary");
  }
}