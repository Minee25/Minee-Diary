const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseManager {
  constructor(dbPath = 'sample.db') {
    this.dbPath = dbPath;
    this.db = null;
  }

  // Initialize database connection
  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  // Create tables
  createTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    age INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

      const createPostsTable = `
                CREATE TABLE IF NOT EXISTS posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    title TEXT NOT NULL,
                    content TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `;

      this.db.serialize(() => {
        this.db.run(createUsersTable, (err) => {
          if (err) {
            console.error('Error creating users table:', err.message);
            reject(err);
            return;
          }
          console.log('Users table created successfully');
        });

        this.db.run(createPostsTable, (err) => {
          if (err) {
            console.error('Error creating posts table:', err.message);
            reject(err);
            return;
          }
          console.log('Posts table created successfully');
          resolve();
        });
      });
    });
  }

  // Insert a new user
  insertUser(name, email, age) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO users (name, email, age) VALUES (?, ?, ?)';
      this.db.run(sql, [name, email, age], function (err) {
        if (err) {
          console.error('Error inserting user:', err.message);
          reject(err);
        } else {
          console.log(`User inserted with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  // Insert a new post
  insertPost(userId, title, content) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)';
      this.db.run(sql, [userId, title, content], function (err) {
        if (err) {
          console.error('Error inserting post:', err.message);
          reject(err);
        } else {
          console.log(`Post inserted with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  // Get all users
  getAllUsers() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users ORDER BY created_at DESC';
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching users:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get user by ID
  getUserById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE id = ?';
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error fetching user:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get posts with user information
  getPostsWithUsers() {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT p.id, p.title, p.content, p.created_at,
                       u.name as author_name, u.email as author_email
                FROM posts p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
            `;
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching posts:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Update user
  updateUser(id, name, email, age) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?';
      this.db.run(sql, [name, email, age, id], function (err) {
        if (err) {
          console.error('Error updating user:', err.message);
          reject(err);
        } else {
          console.log(`User updated. Changes: ${this.changes}`);
          resolve(this.changes);
        }
      });
    });
  }

  // Delete user
  deleteUser(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM users WHERE id = ?';
      this.db.run(sql, [id], function (err) {
        if (err) {
          console.error('Error deleting user:', err.message);
          reject(err);
        } else {
          console.log(`User deleted. Changes: ${this.changes}`);
          resolve(this.changes);
        }
      });
    });
  }

  // Search users by name
  searchUsers(searchTerm) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE name LIKE ? OR email LIKE ?';
      const term = `%${searchTerm}%`;
      this.db.all(sql, [term, term], (err, rows) => {
        if (err) {
          console.error('Error searching users:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

// Example usage and demo
async function runDemo() {
  const dbManager = new DatabaseManager('sample.db');

  try {
    // Connect to database
    await dbManager.connect();

    // Create tables
    await dbManager.createTables();

    // Insert sample users
    console.log('\n--- Inserting Sample Users ---');
    const user1Id = await dbManager.insertUser('John Doe', 'john@example.com', 30);
    const user2Id = await dbManager.insertUser('Jane Smith', 'jane@example.com', 25);
    const user3Id = await dbManager.insertUser('Bob Johnson', 'bob@example.com', 35);

    // Insert sample posts
    console.log('\n--- Inserting Sample Posts ---');
    await dbManager.insertPost(user1Id, 'First Post', 'This is my first post!');
    await dbManager.insertPost(user2Id, 'Hello World', 'Welcome to my blog!');
    await dbManager.insertPost(user1Id, 'Second Post', 'Another post by John');

    // Fetch and display all users
    console.log('\n--- All Users ---');
    const users = await dbManager.getAllUsers();
    console.table(users);

    // Fetch and display posts with user information
    console.log('\n--- Posts with Authors ---');
    const posts = await dbManager.getPostsWithUsers();
    console.table(posts);

    // Get specific user
    console.log('\n--- User by ID ---');
    const user = await dbManager.getUserById(user1Id);
    console.log('User:', user);

    // Update user
    console.log('\n--- Updating User ---');
    await dbManager.updateUser(user1Id, 'John Smith', 'johnsmith@example.com', 31);

    // Search users
    console.log('\n--- Searching Users ---');
    const searchResults = await dbManager.searchUsers('smith');
    console.table(searchResults);

    // Delete user (optional - uncomment to test)
    // console.log('\n--- Deleting User ---');
    // await dbManager.deleteUser(user3Id);

    console.log('\n--- Demo completed successfully! ---');

  } catch (error) {
    console.error('Demo failed:', error);
  } finally {
    // Close database connection
    await dbManager.close();
  }
}

runDemo();