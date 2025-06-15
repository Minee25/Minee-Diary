const sqlite3 = require("sqlite3").verbose();
const path = require("path"); 

const dbPath = path.join(__dirname, "users.db");

const userDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to database:", err.message);
  } else {
    console.log("Connected to SQLite database at:", dbPath);
  }
});

function createTable() {
  userDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_image TEXT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("Error creating users table:", err.message);
    }
    // else {
    //   console.log("Users table is ready");
    // }
  });
}


userDb.serialize(() => {
  createTable();
});

process.on('SIGINT', () => {
  userDb.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

module.exports = userDb; 