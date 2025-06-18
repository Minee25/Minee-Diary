const db = require("../database/configDb");
const bcrypt = require("bcrypt");
const fs = require('fs');
const path = require('path');

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
      title: `${req.user.username} - Create Diary`,
      description: "Create Your Personal Diary",
      header: "Create Diary",
      layout: 'layouts/main',
      user: req.user
    }

    // Check if user already has a diary
    const existingUserDiary = await new Promise((resolve, reject) => {
      const sql = "SELECT * FROM diary WHERE userId = ?";
      db.get(sql, [req.user.userId], (err, row) => {
        if (err) {
          console.error("Error checking user diary:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Handle POST request for creating/updating diary
    if (req.method === 'POST') {
      const {
        title,
        slug,
        description,
        contact,
        music_title,
        music_artist,
        music_url,
        text_color,
        theme_color,
        background_color
      } = req.body;

      // Handle uploaded logo file
      let logoPath = existingUserDiary ? existingUserDiary.logo : null;
      if (req.file) {
        console.log('Logo file uploaded:', req.file);
        // Remove old logo if exists
        if (existingUserDiary && existingUserDiary.logo && existingUserDiary.logo.startsWith('/uploads/')) {
          const oldLogoPath = path.join(__dirname, '../../public', existingUserDiary.logo);
          fs.unlink(oldLogoPath, err => {}); // ignore error
        }
        logoPath = '/uploads/' + req.file.filename;
        console.log('New logo path:', logoPath);
      } else {
        console.log('No logo file uploaded');
      }

      // Validation
      if (!slug) { 
        locals.diary = existingUserDiary; // Pass existing data back to form
        return res.render("diary", locals);
      }

      // Check if slug already exists (excluding current user's diary)
      const existingDiary = await new Promise((resolve, reject) => {
        const sql = "SELECT id FROM diary WHERE slug = ? AND userId != ?";
        db.get(sql, [slug, req.user.userId], (err, row) => {
          if (err) {
            console.error("Error checking slug:", err.message);
            reject(err);
          } else {
            resolve(row);
          }
        });
      });

      if (existingDiary) {
        locals.error = "This URL slug is already taken. Please choose a different one.";
        locals.diary = existingUserDiary; // Pass existing data back to form
        return res.render("diary", locals);
      }

      if (existingUserDiary) {
        // Update existing diary
        const result = await new Promise((resolve, reject) => {
          const sql = `
            UPDATE diary SET 
              slug = ?, logo = ?, title = ?, description = ?, contact = ?, 
              music_title = ?, music_artist = ?, music_url = ?, text_color = ?, theme_color = ?, background_color = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE userId = ?
          `;
          const params = [
            slug,
            logoPath || null,
            title || req.user.username,
            description || null,
            contact || null,
            music_title || null,
            music_artist || null,
            music_url || null,
            text_color || '#000000',
            theme_color || '#EBEEEF',
            background_color || '#C4D2E0',
            req.user.userId
          ];
          
          db.run(sql, params, function(err) {
            if (err) {
              console.error("Error updating diary:", err.message);
              reject(err);
            } else {
              resolve({ id: existingUserDiary.id });
            }
          });
        });

        locals.success = "Diary updated successfully!";
        return res.redirect(`/${slug}`);
      } else {
        // Insert new diary
        const result = await new Promise((resolve, reject) => {
          const sql = `
            INSERT INTO diary (
              userId, slug, logo, title, description, contact, 
              music_title, music_artist, music_url, text_color, theme_color, background_color
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const params = [
            req.user.userId,
            slug,
            logoPath || null,
            title || req.user.username,
            description || null,
            contact || null,
            music_title || null,
            music_artist || null,
            music_url || null,
            text_color || '#000000',
            theme_color || '#EBEEEF',
            background_color || '#C4D2E0'
          ];
          
          db.run(sql, params, function(err) {
            if (err) {
              console.error("Error creating diary:", err.message);
              reject(err);
            } else {
              resolve({ id: this.lastID });
            }
          });
        });

        locals.success = "Diary created successfully!";
        return res.redirect(`/${slug}`);
      }
    }

    // Handle GET request - show the form (create or edit)
    if (existingUserDiary) {
      locals.title = `${req.user.username} - Edit Diary`;
      locals.header = "Edit Diary";
      locals.diary = existingUserDiary;
    }

    res.render("diary", locals);
  } catch (err) {
    console.error("Error in create diary controller:", err);
    res.status(500).send("Error in create diary");
  }
}

module.exports.showDiary = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch diary data by slug
    const diaryData = await new Promise((resolve, reject) => {
      const sql = `
        SELECT d.*, u.display_name, u.username 
        FROM diary d 
        JOIN users u ON d.userId = u.id 
        WHERE d.slug = ?
      `;
      db.get(sql, [id], (err, row) => {
        if (err) {
          console.error("Error fetching diary data:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!diaryData) {
      return res.status(404).send("Diary not found");
    }

    // Fetch memories for this diary
    const memories = await new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM memories 
        WHERE userId = ? 
        ORDER BY created_at DESC
      `;
      db.all(sql, [diaryData.userId], (err, rows) => {
        if (err) {
          console.error("Error fetching memories:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    const locals = {
      title: `${diaryData.title} - Diary`,
      description: diaryData.description || "Personal Diary",
      header: diaryData.title,
      layout: 'layouts/auth',
      user: req.user,
      diary: diaryData,
      memories: memories,
      isOwner: req.user && req.user.userId === diaryData.userId
    }

    res.render("showDiary", locals);
  } catch (err) {
    console.error("Error in show diary controller:", err);
    res.status(500).send("Error in show diary");
  }
}

module.exports.addMemory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { title, description, date, music_url } = req.body;
    
    // Handle uploaded image file
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    // Validation
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Insert new memory
    const result = await new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO memories (
          userId, title, description, image, date, music_url
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      const params = [
        req.user.userId,
        title,
        description || null,
        imagePath || null,
        date || null,
        music_url || null
      ];
      
      db.run(sql, params, function(err) {
        if (err) {
          console.error("Error creating memory:", err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });

    res.json({ success: true, id: result.id });
  } catch (err) {
    console.error("Error in add memory controller:", err);
    res.status(500).json({ error: "Error creating memory" });
  }
}

module.exports.likeMemory = async (req, res) => {
  try {
    const { memoryId } = req.params;

    // Update likes count
    const result = await new Promise((resolve, reject) => {
      const sql = "UPDATE memories SET likes = likes + 1 WHERE id = ?";
      db.run(sql, [memoryId], function(err) {
        if (err) {
          console.error("Error updating likes:", err.message);
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: "Memory not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error in like memory controller:", err);
    res.status(500).json({ error: "Error updating likes" });
  }
}