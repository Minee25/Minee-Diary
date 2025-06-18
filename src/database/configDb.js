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

function createDiaryTable() {
  userDb.run(`
    CREATE TABLE IF NOT EXISTS diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo TEXT,
      title TEXT,
      description TEXT,
      contact TEXT,
      music_title TEXT,
      music_artist TEXT,
      music_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      text_color TEXT DEFAULT '#000000',
      theme_color TEXT DEFAULT '#EBEEEF',
      background_color TEXT DEFAULT '#C4D2E0',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error("Error creating diary table:", err.message);
    } 
  });
}

function createMemories() {
  userDb.run(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image TEXT,
      date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      music_url TEXT,
      likes INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error("Error creating memories table:", err.message);
    }
  });
}

userDb.serialize(() => {
  createTable();
  createDiaryTable();
  createMemories();
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