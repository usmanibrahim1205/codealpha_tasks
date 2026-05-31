const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ulink-super-secret-key-2026';

// Ensure upload folders exist
const uploadDirs = [
  'uploads',
  'uploads/avatars',
  'uploads/posts',
  'uploads/stories',
  'uploads/voice'
];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/posts';
    // Robustly retrieve request path/URL string to check partition targets
    const reqPath = (req.path || req.url || req.originalUrl || '').toLowerCase();
    
    if (reqPath.includes('avatar') || reqPath.includes('profile') || (req.body && req.body.uploadType === 'avatar')) {
      folder = 'uploads/avatars';
    } else if (reqPath.includes('story') || reqPath.includes('stories') || (req.body && req.body.uploadType === 'story')) {
      folder = 'uploads/stories';
    } else if (reqPath.includes('voice') || (req.body && req.body.uploadType === 'voice') || (file.mimetype && file.mimetype.startsWith('audio')) || (file.originalname && file.originalname.endsWith('.webm'))) {
      folder = 'uploads/voice';
    }
    cb(null, path.join(__dirname, folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Promised Database Helpers
const dbRun = (sql, params = []) => new Promise((res, rej) => {
  db.run(sql, params, function(err) {
    if (err) rej(err);
    else res(this);
  });
});
const dbGet = (sql, params = []) => new Promise((res, rej) => {
  db.get(sql, params, (err, row) => {
    if (err) rej(err);
    else res(row);
  });
});
const dbAll = (sql, params = []) => new Promise((res, rej) => {
  db.all(sql, params, (err, rows) => {
    if (err) rej(err);
    else res(rows);
  });
});

// Create tables
const initDb = async () => {
  db.serialize(() => {
    // Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      full_name TEXT,
      bio TEXT,
      profile_pic TEXT,
      is_private INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Follows
    db.run(`CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER,
      following_id INTEGER,
      status TEXT, -- 'pending' or 'accepted'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(follower_id, following_id)
    )`);

    // Posts & Reels
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      caption TEXT,
      location TEXT,
      type TEXT DEFAULT 'post', -- 'post' or 'reel'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Post Media (supporting carousels)
    db.run(`CREATE TABLE IF NOT EXISTS post_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      media_url TEXT,
      media_type TEXT, -- 'image' or 'video'
      media_filter TEXT DEFAULT 'normal',
      order_index INTEGER DEFAULT 0
    )`);

    // Likes
    db.run(`CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      post_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id)
    )`);

    // Comments
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      post_id INTEGER,
      parent_id INTEGER DEFAULT NULL,
      text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Stories (expires 24 hours from creation)
    db.run(`CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      media_url TEXT,
      media_type TEXT, -- 'image' or 'video'
      text_content TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Story Highlights
    db.run(`CREATE TABLE IF NOT EXISTS story_highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      cover_pic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Story Highlight Items
    db.run(`CREATE TABLE IF NOT EXISTS story_highlight_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      highlight_id INTEGER,
      story_id INTEGER
    )`);

    // Threads (Conversations)
    db.run(`CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      is_group INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Thread Members
    db.run(`CREATE TABLE IF NOT EXISTS thread_members (
      thread_id INTEGER,
      user_id INTEGER,
      PRIMARY KEY(thread_id, user_id)
    )`);

    // Messages
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      thread_id INTEGER,
      message_type TEXT, -- 'text', 'image', 'video', 'voice', 'sticker'
      content TEXT,
      media_url TEXT,
      reaction TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Privacy settings (Blocked, Restricted, Muted, Close Friends)
    db.run(`CREATE TABLE IF NOT EXISTS privacy_settings (
      user_id INTEGER,
      target_user_id INTEGER,
      is_blocked INTEGER DEFAULT 0,
      is_restricted INTEGER DEFAULT 0,
      is_muted INTEGER DEFAULT 0,
      is_close_friend INTEGER DEFAULT 0,
      PRIMARY KEY(user_id, target_user_id)
    )`);

    // Saved Posts
    db.run(`CREATE TABLE IF NOT EXISTS saved_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      post_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id)
    )`);

    // Notifications Table (Activity Feed)
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notifier_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      post_id INTEGER DEFAULT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(notifier_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    )`);

    // Migration: Add is_read to messages if it doesn't exist
    db.run("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0", (err) => {
      // Safely ignore duplicate column errors
    });
  });
};
initDb();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- AUTHENTICATION API ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await dbGet('SELECT id FROM users WHERE username = ? OR email = ?', [trimmedUsername, trimmedEmail]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const result = await dbRun(
      'INSERT INTO users (username, email, password_hash, full_name, bio, profile_pic) VALUES (?, ?, ?, ?, ?, ?)',
      [trimmedUsername, trimmedEmail, hash, full_name || '', '', '/uploads/avatars/default.svg']
    );

    const token = jwt.sign({ id: result.lastID, username: trimmedUsername, email: trimmedEmail }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
    res.status(201).json({ message: 'Registered successfully', user: { id: result.lastID, username: trimmedUsername, email: trimmedEmail } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const queryStr = usernameOrEmail.includes('@') ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE username = ?';
    const user = await dbGet(queryStr, [usernameOrEmail.trim().toLowerCase()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username/email or password' });
    }

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return res.status(400).json({ error: 'Invalid username/email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
    res.json({ message: 'Logged in successfully', user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// Get Current User (Me)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, username, email, full_name, bio, profile_pic, is_private FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'All fields are required' });

    const user = await dbGet('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Incorrect old password' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Account
app.post('/api/auth/delete-account', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;
    // Complete cascade deletion across SQLite database
    await dbRun('DELETE FROM users WHERE id = ?', [uid]);
    await dbRun('DELETE FROM posts WHERE user_id = ?', [uid]);
    await dbRun('DELETE FROM likes WHERE user_id = ?', [uid]);
    await dbRun('DELETE FROM comments WHERE user_id = ?', [uid]);
    await dbRun('DELETE FROM stories WHERE user_id = ?', [uid]);
    await dbRun('DELETE FROM story_highlights WHERE user_id = ?', [uid]);
    await dbRun('DELETE FROM saved_posts WHERE user_id = ?', [uid]);
    await dbRun('DELETE FROM follows WHERE follower_id = ? OR following_id = ?', [uid, uid]);
    await dbRun('DELETE FROM privacy_settings WHERE user_id = ? OR target_user_id = ?', [uid, uid]);
    await dbRun('DELETE FROM thread_members WHERE user_id = ?', [uid]);

    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- USER PROFILES & SETTINGS ---

// Get User Profile details
app.get('/api/users/profile/:username', authenticateToken, async (req, res) => {
  try {
    const currentUid = req.user.id;
    const targetUser = await dbGet(
      'SELECT id, username, full_name, bio, profile_pic, is_private FROM users WHERE username = ?',
      [req.params.username.toLowerCase()]
    );
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Relationships
    const isSelf = currentUid === targetUser.id;

    // Follow status
    let followStatus = null; // null, 'pending', 'accepted'
    if (!isSelf) {
      const follow = await dbGet('SELECT status FROM follows WHERE follower_id = ? AND following_id = ?', [currentUid, targetUser.id]);
      if (follow) followStatus = follow.status;
    }

    // Check Block List
    const block1 = await dbGet('SELECT 1 FROM privacy_settings WHERE user_id = ? AND target_user_id = ? AND is_blocked = 1', [currentUid, targetUser.id]);
    const block2 = await dbGet('SELECT 1 FROM privacy_settings WHERE user_id = ? AND target_user_id = ? AND is_blocked = 1', [targetUser.id, currentUid]);
    if (block1 || block2) {
      return res.status(403).json({ error: 'Account not accessible', isBlocked: true });
    }

    // Counters
    const followersCount = (await dbGet('SELECT COUNT(*) as cnt FROM follows WHERE following_id = ? AND status = "accepted"', [targetUser.id])).cnt;
    const followingCount = (await dbGet('SELECT COUNT(*) as cnt FROM follows WHERE follower_id = ? AND status = "accepted"', [targetUser.id])).cnt;
    const postsCount = (await dbGet('SELECT COUNT(*) as cnt FROM posts WHERE user_id = ?', [targetUser.id])).cnt;

    const profile = {
      ...targetUser,
      isSelf,
      followStatus,
      followersCount,
      followingCount,
      postsCount
    };

    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
app.post('/api/users/update-profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { full_name, bio, is_private } = req.body;
    const uid = req.user.id;

    let updateFields = [];
    let params = [];

    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      params.push(full_name);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      params.push(bio);
    }
    if (is_private !== undefined) {
      updateFields.push('is_private = ?');
      params.push(parseInt(is_private));
    }
    if (req.file) {
      const avatarUrl = '/uploads/avatars/' + req.file.filename;
      updateFields.push('profile_pic = ?');
      params.push(avatarUrl);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No update parameters supplied' });
    }

    params.push(uid);
    await dbRun(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, params);

    const updatedUser = await dbGet('SELECT id, username, email, full_name, bio, profile_pic, is_private FROM users WHERE id = ?', [uid]);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search Users
app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') return res.json({ users: [], posts: [] });

    const currentUid = req.user.id;
    const cleanQuery = query.trim().toLowerCase();

    // Exclude blocked users from search
    const blockedUserIds = (await dbAll(
      `SELECT target_user_id FROM privacy_settings WHERE user_id = ${currentUid} AND is_blocked = 1
       UNION
       SELECT user_id FROM privacy_settings WHERE target_user_id = ${currentUid} AND is_blocked = 1`
    )).map(u => u.target_user_id || u.user_id);

    const placeholders = blockedUserIds.length > 0 ? `AND id NOT IN (${blockedUserIds.join(',')})` : '';

    // Search accounts
    let users = await dbAll(
      `SELECT id, username, full_name, profile_pic FROM users 
       WHERE (username LIKE ? OR full_name LIKE ?) ${placeholders} LIMIT 10`,
      [`%${cleanQuery}%`, `%${cleanQuery}%`]
    );

    // Search posts via hashtags or locations
    let posts = [];
    if (cleanQuery.startsWith('#')) {
      const hashtag = cleanQuery;
      posts = await dbAll(
        `SELECT p.*, u.username, u.profile_pic,
                (SELECT media_url FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as cover_url,
                (SELECT media_type FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as cover_type
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.caption LIKE ? AND u.id NOT IN (
           SELECT target_user_id FROM privacy_settings WHERE user_id = ${currentUid} AND is_blocked = 1
           UNION
           SELECT user_id FROM privacy_settings WHERE target_user_id = ${currentUid} AND is_blocked = 1
         ) LIMIT 20`,
        [`%${hashtag}%`]
      );
    } else {
      posts = await dbAll(
        `SELECT p.*, u.username, u.profile_pic,
                (SELECT media_url FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as cover_url,
                (SELECT media_type FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as cover_type
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE (p.location LIKE ? OR p.caption LIKE ?) AND u.id NOT IN (
           SELECT target_user_id FROM privacy_settings WHERE user_id = ${currentUid} AND is_blocked = 1
           UNION
           SELECT user_id FROM privacy_settings WHERE target_user_id = ${currentUid} AND is_blocked = 1
         ) LIMIT 20`,
        [`%${cleanQuery}%`, `%${cleanQuery}%`]
      );
    }

    res.json({ users, posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- POSTS & REELS API ---

// Create Post or Reel
app.post('/api/posts/create', authenticateToken, upload.array('media', 10), async (req, res) => {
  try {
    const { caption, location, type, filters } = req.body; // filters will be a JSON string or array of filter names matching the uploaded media order
    const uid = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one media file is required' });
    }

    const postType = type === 'reel' ? 'reel' : 'post';

    // Insert post metadata
    const postResult = await dbRun(
      'INSERT INTO posts (user_id, caption, location, type) VALUES (?, ?, ?, ?)',
      [uid, caption || '', location || '', postType]
    );
    const postId = postResult.lastID;

    // Parse filters
    let parsedFilters = [];
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (e) {
        parsedFilters = [filters]; // fallback single string
      }
    }

    // Insert media records
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const mediaUrl = '/uploads/posts/' + file.filename;
      const mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';
      const filter = parsedFilters[i] || 'normal';

      await dbRun(
        'INSERT INTO post_media (post_id, media_url, media_type, media_filter, order_index) VALUES (?, ?, ?, ?, ?)',
        [postId, mediaUrl, mediaType, filter, i]
      );
    }

    res.status(201).json({ message: 'Post uploaded successfully', postId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Main Feed (Posts and Reels of followed creators + public accounts, excluding blocked/muted)
app.get('/api/posts/feed', authenticateToken, async (req, res) => {
  try {
    const currentUid = req.user.id;

    // Get feed items where poster is:
    // 1. Current user
    // 2. Someone followed (accepted)
    // 3. A public account
    // AND NOT BLOCKED OR MUTED
    const feedPosts = await dbAll(
      `SELECT p.*, u.username, u.full_name, u.profile_pic,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as has_liked,
              (SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = ?) as has_saved
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE (p.user_id = ? 
         OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ? AND status = "accepted")
         OR u.is_private = 0
       )
       AND p.user_id NOT IN (
         SELECT target_user_id FROM privacy_settings WHERE user_id = ? AND (is_blocked = 1 OR is_muted = 1)
         UNION
         SELECT user_id FROM privacy_settings WHERE target_user_id = ? AND is_blocked = 1
       )
       ORDER BY p.created_at DESC LIMIT 50`,
      [currentUid, currentUid, currentUid, currentUid, currentUid, currentUid]
    );

    // Retrieve media elements for all fetched feed items
    for (let post of feedPosts) {
      post.media = await dbAll('SELECT * FROM post_media WHERE post_id = ? ORDER BY order_index ASC', [post.id]);
    }

    res.json({ feed: feedPosts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Reels Feed
app.get('/api/posts/reels', authenticateToken, async (req, res) => {
  try {
    const currentUid = req.user.id;
    const reels = await dbAll(
      `SELECT p.*, u.username, u.full_name, u.profile_pic,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
              (SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as has_liked,
              (SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = ?) as has_saved
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.type = "reel"
       AND p.user_id NOT IN (
         SELECT target_user_id FROM privacy_settings WHERE user_id = ? AND (is_blocked = 1 OR is_muted = 1)
         UNION
         SELECT user_id FROM privacy_settings WHERE target_user_id = ? AND is_blocked = 1
       )
       ORDER BY random() LIMIT 20`,
      [currentUid, currentUid, currentUid, currentUid]
    );

    for (let reel of reels) {
      reel.media = await dbAll('SELECT * FROM post_media WHERE post_id = ? ORDER BY order_index ASC', [reel.id]);
    }

    res.json({ reels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch posts/reels created by a specific user
app.get('/api/posts/user/:username', authenticateToken, async (req, res) => {
  try {
    const currentUid = req.user.id;
    const targetUser = await dbGet('SELECT id, is_private FROM users WHERE username = ?', [req.params.username.toLowerCase()]);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Validate access boundaries
    const isSelf = currentUid === targetUser.id;
    const block1 = await dbGet('SELECT 1 FROM privacy_settings WHERE user_id = ? AND target_user_id = ? AND is_blocked = 1', [currentUid, targetUser.id]);
    const block2 = await dbGet('SELECT 1 FROM privacy_settings WHERE user_id = ? AND target_user_id = ? AND is_blocked = 1', [targetUser.id, currentUid]);
    if (block1 || block2) return res.status(403).json({ error: 'Access denied (blocked)' });

    if (!isSelf && targetUser.is_private) {
      const follow = await dbGet('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? AND status = "accepted"', [currentUid, targetUser.id]);
      if (!follow) return res.status(403).json({ error: 'This Account is Private. Follow to view posts.', isPrivate: true });
    }

    const posts = await dbAll(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
              (SELECT media_url FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as cover_url,
              (SELECT media_type FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as cover_type
       FROM posts p
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [targetUser.id]
    );

    // Expand media details
    for (let post of posts) {
      post.media = await dbAll('SELECT * FROM post_media WHERE post_id = ? ORDER BY order_index ASC', [post.id]);
    }

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch a single post's details
app.get('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const currentUid = req.user.id;
    const post = await dbGet(
      `SELECT p.*, u.username, u.full_name, u.profile_pic,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
              (SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as has_liked,
              (SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = ?) as has_saved
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [currentUid, currentUid, req.params.id]
    );

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Retrieve media elements
    post.media = await dbAll('SELECT * FROM post_media WHERE post_id = ? ORDER BY order_index ASC', [post.id]);

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like Post
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    await dbRun('INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, req.params.id]);
    
    // Trigger notification
    try {
      const post = await dbGet('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
      if (post) {
        await createAndSendNotification(req.user.id, post.user_id, 'like', req.params.id);
      }
    } catch (nErr) {
      console.error('Failed to trigger like notification:', nErr);
    }

    res.json({ message: 'Liked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlike Post
app.post('/api/posts/:id/unlike', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, req.params.id]);
    
    // Clean up corresponding like notification
    try {
      const post = await dbGet('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
      if (post) {
        await dbRun(
          'DELETE FROM notifications WHERE notifier_id = ? AND receiver_id = ? AND type = ? AND post_id = ?',
          [req.user.id, post.user_id, 'like', req.params.id]
        );
      }
    } catch (nErr) {
      console.error('Failed to clear like notification:', nErr);
    }

    res.json({ message: 'Unliked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bookmark / Save Post
app.post('/api/posts/:id/save', authenticateToken, async (req, res) => {
  try {
    const post_id = req.params.id;
    const exists = await dbGet('SELECT 1 FROM saved_posts WHERE user_id = ? AND post_id = ?', [req.user.id, post_id]);
    if (exists) {
      await dbRun('DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?', [req.user.id, post_id]);
      res.json({ message: 'Removed from bookmarks', saved: false });
    } else {
      await dbRun('INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)', [req.user.id, post_id]);
      res.json({ message: 'Added to bookmarks', saved: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current User's Saved Posts
app.get('/api/posts/saved', authenticateToken, async (req, res) => {
  try {
    const currentUid = req.user.id;
    const saved = await dbAll(
      `SELECT p.*, u.username, u.profile_pic,
              (SELECT media_url FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as cover_url,
              (SELECT media_type FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as cover_type
       FROM saved_posts s
       JOIN posts p ON s.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [currentUid]
    );

    for (let post of saved) {
      post.media = await dbAll('SELECT * FROM post_media WHERE post_id = ? ORDER BY order_index ASC', [post.id]);
    }
    res.json({ saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- COMMENTS SECTION ---

// Get Comments on Post
app.get('/api/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const pid = req.params.id;
    const currentUid = req.user.id;

    // Fetch comments, accounting for restricted settings
    // If target post belongs to user A, and commenter is restricted user B, comments from B are only visible to B and A.
    const comments = await dbAll(
      `SELECT c.*, u.username, u.profile_pic,
              (SELECT 1 FROM privacy_settings WHERE user_id = p.user_id AND target_user_id = c.user_id AND is_restricted = 1) as is_restricted_comment
       FROM comments c
       JOIN users u ON c.user_id = u.id
       JOIN posts p ON c.post_id = p.id
       WHERE c.post_id = ?
       AND (
         is_restricted_comment IS NULL
         OR is_restricted_comment = 0
         OR c.user_id = ?
         OR p.user_id = ?
       )
       ORDER BY c.created_at ASC`,
      [pid, currentUid, currentUid]
    );

    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Comment to Post
app.post('/api/posts/:id/comments/create', authenticateToken, async (req, res) => {
  try {
    const { text, parent_id } = req.body;
    if (!text || text.trim() === '') return res.status(400).json({ error: 'Comment text required' });

    const result = await dbRun(
      'INSERT INTO comments (user_id, post_id, parent_id, text) VALUES (?, ?, ?, ?)',
      [req.user.id, req.params.id, parent_id || null, text]
    );

    // Trigger notification
    try {
      const post = await dbGet('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
      if (post) {
        await createAndSendNotification(req.user.id, post.user_id, 'comment', req.params.id);
      }
    } catch (nErr) {
      console.error('Failed to trigger comment notification:', nErr);
    }

    const newComment = await dbGet(
      'SELECT c.*, u.username, u.profile_pic FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [result.lastID]
    );

    res.status(201).json({ message: 'Comment created successfully', comment: newComment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- FOLLOWS SYSTEM ---

// Follow/Request User
app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const follower = req.user.id;
    const following = parseInt(req.params.id);

    if (follower === following) return res.status(400).json({ error: 'You cannot follow yourself' });

    const targetUser = await dbGet('SELECT is_private FROM users WHERE id = ?', [following]);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const status = targetUser.is_private ? 'pending' : 'accepted';

    await dbRun(
      'INSERT OR REPLACE INTO follows (follower_id, following_id, status) VALUES (?, ?, ?)',
      [follower, following, status]
    );

    // Trigger notification
    try {
      await createAndSendNotification(follower, following, 'follow');
    } catch (nErr) {
      console.error('Failed to trigger follow notification:', nErr);
    }

    res.json({ message: 'Follow operation complete', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unfollow User
app.post('/api/users/:id/unfollow', authenticateToken, async (req, res) => {
  try {
    await dbRun(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, req.params.id]
    );

    // Trigger follow notification cleanup
    try {
      await dbRun(
        'DELETE FROM notifications WHERE notifier_id = ? AND receiver_id = ? AND type = ?',
        [req.user.id, req.params.id, 'follow']
      );
    } catch (nErr) {
      console.error('Failed to clear follow notification:', nErr);
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Followers
app.get('/api/users/:id/followers', authenticateToken, async (req, res) => {
  try {
    const list = await dbAll(
      `SELECT u.id, u.username, u.full_name, u.profile_pic, f.status 
       FROM follows f 
       JOIN users u ON f.follower_id = u.id 
       WHERE f.following_id = ?`,
      [req.params.id]
    );
    res.json({ followers: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Following
app.get('/api/users/:id/following', authenticateToken, async (req, res) => {
  try {
    const list = await dbAll(
      `SELECT u.id, u.username, u.full_name, u.profile_pic, f.status 
       FROM follows f 
       JOIN users u ON f.following_id = u.id 
       WHERE f.follower_id = ?`,
      [req.params.id]
    );
    res.json({ following: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending follow requests for the logged-in user
app.get('/api/users/follow-requests', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;
    const requests = await dbAll(
      `SELECT u.id, u.username, u.full_name, u.profile_pic 
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ? AND f.status = 'pending'`,
      [uid]
    );
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve follow request
app.post('/api/users/follow-requests/:id/approve', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id; // the user being followed (following_id)
    const followerId = parseInt(req.params.id);

    await dbRun(
      `UPDATE follows SET status = 'accepted' 
       WHERE follower_id = ? AND following_id = ?`,
      [followerId, uid]
    );

    res.json({ message: 'Follow request approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject/Delete follow request
app.post('/api/users/follow-requests/:id/reject', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id; // the user being followed (following_id)
    const followerId = parseInt(req.params.id);

    await dbRun(
      `DELETE FROM follows 
       WHERE follower_id = ? AND following_id = ? AND status = 'pending'`,
      [followerId, uid]
    );

    res.json({ message: 'Follow request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- STORIES & HIGHLIGHTS API ---

// Create Story (Disappearing Content)
app.post('/api/stories/create', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const { text_content } = req.body;
    const uid = req.user.id;

    if (!req.file) return res.status(400).json({ error: 'Story media file required' });

    const mediaUrl = '/uploads/stories/' + req.file.filename;
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

    // Expires in exactly 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    await dbRun(
      'INSERT INTO stories (user_id, media_url, media_type, text_content, expires_at) VALUES (?, ?, ?, ?, ?)',
      [uid, mediaUrl, mediaType, text_content || '', expiresAt]
    );

    res.status(201).json({ message: 'Story posted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Active Stories Feed
app.get('/api/stories/feed', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;

    // Filter active stories from self and followed accounts
    // Supporting Close Friends boundary: if a story is created, we can flag close friends (handled by privacy rules)
    const stories = await dbAll(
      `SELECT s.*, u.username, u.profile_pic 
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.expires_at > datetime('now')
       AND (
         s.user_id = ?
         OR s.user_id IN (SELECT following_id FROM follows WHERE follower_id = ? AND status = "accepted")
       )
       AND s.user_id NOT IN (
         SELECT target_user_id FROM privacy_settings WHERE user_id = ? AND is_blocked = 1
       )
       ORDER BY s.created_at ASC`,
      [uid, uid, uid]
    );

    // Group stories by creator for UI circles
    const grouped = {};
    for (let story of stories) {
      if (!grouped[story.user_id]) {
        // Check if close friend configuration filters this story
        const isCloseFriend = await dbGet(
          'SELECT 1 FROM privacy_settings WHERE user_id = ? AND target_user_id = ? AND is_close_friend = 1',
          [story.user_id, uid]
        );
        
        grouped[story.user_id] = {
          user_id: story.user_id,
          username: story.username,
          profile_pic: story.profile_pic,
          isCloseFriend: !!isCloseFriend,
          stories: []
        };
      }
      grouped[story.user_id].stories.push(story);
    }

    res.json({ feed: Object.values(grouped) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Story Highlight
app.post('/api/stories/highlights/create', authenticateToken, async (req, res) => {
  try {
    const { title, storyIds } = req.body;
    const uid = req.user.id;

    if (!title || !storyIds || storyIds.length === 0) {
      return res.status(400).json({ error: 'Title and story IDs are required' });
    }

    // Cover pic uses media of the first story selected
    const coverStory = await dbGet('SELECT media_url FROM stories WHERE id = ?', [storyIds[0]]);
    const coverPic = coverStory ? coverStory.media_url : '/uploads/avatars/default.svg';

    const hResult = await dbRun(
      'INSERT INTO story_highlights (user_id, title, cover_pic) VALUES (?, ?, ?)',
      [uid, title, coverPic]
    );
    const highlightId = hResult.lastID;

    for (let sid of storyIds) {
      await dbRun(
        'INSERT INTO story_highlight_items (highlight_id, story_id) VALUES (?, ?)',
        [highlightId, sid]
      );
    }

    res.status(201).json({ message: 'Highlight created successfully', highlightId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Highlights for a Profile
app.get('/api/stories/highlights/user/:username', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id FROM users WHERE username = ?', [req.params.username.toLowerCase()]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const highlights = await dbAll('SELECT * FROM story_highlights WHERE user_id = ?', [user.id]);

    for (let h of highlights) {
      h.items = await dbAll(
        `SELECT s.* FROM story_highlight_items hi
         JOIN stories s ON hi.story_id = s.id
         WHERE hi.highlight_id = ?`,
        [h.id]
      );
    }

    res.json({ highlights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Post or Reel
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await dbGet('SELECT user_id FROM posts WHERE id = ?', [postId]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    // Cascade delete related records
    await dbRun('DELETE FROM posts WHERE id = ?', [postId]);
    await dbRun('DELETE FROM post_media WHERE post_id = ?', [postId]);
    await dbRun('DELETE FROM likes WHERE post_id = ?', [postId]);
    await dbRun('DELETE FROM comments WHERE post_id = ?', [postId]);
    await dbRun('DELETE FROM saved_posts WHERE post_id = ?', [postId]);
    await dbRun('DELETE FROM notifications WHERE post_id = ? AND type IN ("like", "comment")', [postId]);

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Story
app.delete('/api/stories/:id', authenticateToken, async (req, res) => {
  try {
    const storyId = req.params.id;
    const story = await dbGet('SELECT user_id FROM stories WHERE id = ?', [storyId]);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    await dbRun('DELETE FROM stories WHERE id = ?', [storyId]);
    await dbRun('DELETE FROM story_highlight_items WHERE story_id = ?', [storyId]);

    res.json({ message: 'Story deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Highlight
app.delete('/api/stories/highlights/:id', authenticateToken, async (req, res) => {
  try {
    const hid = req.params.id;
    const highlight = await dbGet('SELECT user_id FROM story_highlights WHERE id = ?', [hid]);
    if (!highlight) return res.status(404).json({ error: 'Highlight not found' });
    if (highlight.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    await dbRun('DELETE FROM story_highlights WHERE id = ?', [hid]);
    await dbRun('DELETE FROM story_highlight_items WHERE highlight_id = ?', [hid]);

    res.json({ message: 'Highlight deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- PRIVACY AND SECURITY CONTROL API ---

// Modify Privacy Rule Settings (Block, Restrict, Mute, Close Friend)
app.post('/api/privacy/settings', authenticateToken, async (req, res) => {
  try {
    const { target_user_id, action, value } = req.body; // action: 'block', 'restrict', 'mute', 'close_friend'; value: 0 or 1
    const uid = req.user.id;

    if (!target_user_id || !action) {
      return res.status(400).json({ error: 'Target ID and Action are required' });
    }

    const fieldMap = {
      block: 'is_blocked',
      restrict: 'is_restricted',
      mute: 'is_muted',
      close_friend: 'is_close_friend'
    };

    const dbField = fieldMap[action];
    if (!dbField) return res.status(400).json({ error: 'Invalid Action type' });

    // Ensure settings record exists
    await dbRun(
      'INSERT OR IGNORE INTO privacy_settings (user_id, target_user_id) VALUES (?, ?)',
      [uid, target_user_id]
    );

    await dbRun(
      `UPDATE privacy_settings SET ${dbField} = ? WHERE user_id = ? AND target_user_id = ?`,
      [value ? 1 : 0, uid, target_user_id]
    );

    // If block operation is executed, break existing following chains instantly
    if (action === 'block' && value === 1) {
      await dbRun('DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)', [uid, target_user_id, target_user_id, uid]);
    }

    res.json({ message: `Privacy configuration '${action}' updated successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch current Privacy controls
app.get('/api/privacy/settings', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;
    const settings = await dbAll(
      `SELECT ps.*, u.username, u.profile_pic 
       FROM privacy_settings ps
       JOIN users u ON ps.target_user_id = u.id
       WHERE ps.user_id = ?`,
      [uid]
    );
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- DIRECT MESSAGING / CHATS REST ---

// Get User's Threads List (chats)
app.get('/api/dms/threads', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;
    const threads = await dbAll(
      `SELECT t.*, 
              (SELECT content FROM messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
              (SELECT COUNT(*) FROM messages WHERE thread_id = t.id AND sender_id != ? AND is_read = 0) as unread_count
       FROM threads t
       JOIN thread_members tm ON t.id = tm.thread_id
       WHERE tm.user_id = ?
       ORDER BY last_message_time DESC`,
      [uid, uid]
    );

    for (let thread of threads) {
      // Find other participants in the conversation
      const participants = await dbAll(
        `SELECT u.id, u.username, u.full_name, u.profile_pic 
         FROM thread_members tm
         JOIN users u ON tm.user_id = u.id
         WHERE tm.thread_id = ? AND tm.user_id != ?`,
        [thread.id, uid]
      );
      thread.participants = participants;
      
      // Default thread header details
      if (!thread.is_group && participants[0]) {
        thread.name = participants[0].full_name || participants[0].username;
        thread.profile_pic = participants[0].profile_pic;
      } else {
        thread.profile_pic = '/uploads/avatars/default.svg'; // default group pic
      }
    }

    res.json({ threads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch single thread messages
app.get('/api/dms/threads/:id/messages', authenticateToken, async (req, res) => {
  try {
    const tid = req.params.id;
    const uid = req.user.id;

    // Check thread membership
    const member = await dbGet('SELECT 1 FROM thread_members WHERE thread_id = ? AND user_id = ?', [tid, uid]);
    if (!member) return res.status(403).json({ error: 'Access to thread denied' });

    const messages = await dbAll(
      `SELECT m.*, u.username, u.profile_pic 
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.thread_id = ?
       ORDER BY m.created_at ASC`,
      [tid]
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Thread Messages as Read
app.post('/api/dms/threads/:id/read', authenticateToken, async (req, res) => {
  try {
    const tid = req.params.id;
    const uid = req.user.id;
    await dbRun('UPDATE messages SET is_read = 1 WHERE thread_id = ? AND sender_id != ? AND is_read = 0', [tid, uid]);
    
    // Broadcast real-time read receipt to thread members via WebSockets
    try {
      const members = await dbAll('SELECT user_id FROM thread_members WHERE thread_id = ?', [tid]);
      members.forEach(member => {
        if (clients.has(member.user_id)) {
          clients.get(member.user_id).forEach(clientWs => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'read',
                threadId: parseInt(tid),
                readerId: uid
              }));
            }
          });
        }
      });
    } catch (wsErr) {
      console.error('Failed to broadcast read notification:', wsErr);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start a thread or get existing one
app.post('/api/dms/threads/start', authenticateToken, async (req, res) => {
  try {
    const { targetUserIds, name, isGroup } = req.body;
    const uid = req.user.id;

    if (!targetUserIds || targetUserIds.length === 0) {
      return res.status(400).json({ error: 'At least one target user required' });
    }

    const allMembers = [uid, ...targetUserIds.map(id => parseInt(id))];

    // For 1-on-1 private threads, look up existing match
    if (!isGroup && allMembers.length === 2) {
      const existing = await dbGet(
        `SELECT tm1.thread_id 
         FROM thread_members tm1
         JOIN thread_members tm2 ON tm1.thread_id = tm2.thread_id
         JOIN threads t ON tm1.thread_id = t.id
         WHERE t.is_group = 0 AND tm1.user_id = ? AND tm2.user_id = ?`,
        [allMembers[0], allMembers[1]]
      );

      if (existing) {
        return res.json({ threadId: existing.thread_id, isNew: false });
      }
    }

    // Insert new thread
    const groupVal = isGroup ? 1 : 0;
    const tResult = await dbRun(
      'INSERT INTO threads (name, is_group) VALUES (?, ?)',
      [name || '', groupVal]
    );
    const threadId = tResult.lastID;

    // Associate members
    for (let memberId of allMembers) {
      await dbRun(
        'INSERT INTO thread_members (thread_id, user_id) VALUES (?, ?)',
        [threadId, memberId]
      );
    }

    res.status(201).json({ threadId, isNew: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DM Media Uploads (images, videos, or voice logs)
app.post('/api/dms/upload', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No media file provided' });

    let mediaUrl = '';
    let messageType = 'image';

    if (req.file.mimetype.startsWith('audio')) {
      mediaUrl = '/uploads/voice/' + req.file.filename;
      messageType = 'voice';
    } else if (req.file.mimetype.startsWith('video')) {
      mediaUrl = '/uploads/posts/' + req.file.filename;
      messageType = 'video';
    } else {
      mediaUrl = '/uploads/posts/' + req.file.filename;
      messageType = 'image';
    }

    res.json({ mediaUrl, messageType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- NOTIFICATIONS (ACTIVITY) SYSTEM API ---

// Fetch user's notifications (Activity feed)
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;
    const notifications = await dbAll(`
      SELECT n.*, 
             u.username as notifier_username, 
             u.profile_pic as notifier_profile_pic,
             (SELECT media_url FROM post_media WHERE post_id = n.post_id ORDER BY order_index ASC LIMIT 1) as post_thumbnail,
             (SELECT type FROM posts WHERE id = n.post_id) as post_type
      FROM notifications n
      JOIN users u ON n.notifier_id = u.id
      WHERE n.receiver_id = ?
      ORDER BY n.created_at DESC
    `, [uid]);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all received notifications as read
app.post('/api/notifications/read', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;
    await dbRun('UPDATE notifications SET is_read = 1 WHERE receiver_id = ? AND is_read = 0', [uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch count of unread notifications
app.get('/api/notifications/unread-count', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;
    const result = await dbGet('SELECT COUNT(*) as unread_count FROM notifications WHERE receiver_id = ? AND is_read = 0', [uid]);
    res.json({ unread_count: result.unread_count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- REAL-TIME WEBSOCKET ROUTING LOGIC ---

// Keep track of connected clients
const clients = new Map(); // userId -> Set of WS instances

async function createAndSendNotification(notifierId, receiverId, type, postId = null) {
  if (notifierId === receiverId) return; // Don't notify self
  try {
    const result = await dbRun(
      'INSERT INTO notifications (notifier_id, receiver_id, type, post_id) VALUES (?, ?, ?, ?)',
      [notifierId, receiverId, type, postId]
    );
    
    const notifId = result.lastID;
    const notif = await dbGet(`
      SELECT n.*, 
             u.username as notifier_username, 
             u.profile_pic as notifier_profile_pic,
             (SELECT media_url FROM post_media WHERE post_id = n.post_id ORDER BY order_index ASC LIMIT 1) as post_thumbnail,
             (SELECT type FROM posts WHERE id = n.post_id) as post_type
      FROM notifications n
      JOIN users u ON n.notifier_id = u.id
      WHERE n.id = ?
    `, [notifId]);

    // Broadcast if receiver is online
    if (clients.has(receiverId) && notif) {
      clients.get(receiverId).forEach(clientWs => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'notification',
            notification: notif
          }));
        }
      });
    }
  } catch (err) {
    console.error('Failed to create/send notification:', err);
  }
}

wss.on('connection', (ws, req) => {
  let user = null;

  // Perform socket handshake/auth
  try {
    const cookies = req.headers.cookie ? require('cookie').parse(req.headers.cookie) : {};
    const token = cookies.token;
    if (!token) throw new Error('Unauthenticated WebSocket connection');

    user = jwt.verify(token, JWT_SECRET);
    if (!clients.has(user.id)) {
      clients.set(user.id, new Set());
    }
    clients.get(user.id).add(ws);
  } catch (err) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  ws.on('message', async (messageBuffer) => {
    try {
      const data = JSON.parse(messageBuffer.toString());

      if (data.type === 'message') {
        const { threadId, messageType, content, mediaUrl } = data;

        // Check thread authorization
        const isMember = await dbGet('SELECT 1 FROM thread_members WHERE thread_id = ? AND user_id = ?', [threadId, user.id]);
        if (!isMember) return;

        // Insert message in DB
        const result = await dbRun(
          'INSERT INTO messages (sender_id, thread_id, message_type, content, media_url) VALUES (?, ?, ?, ?, ?)',
          [user.id, threadId, messageType, content || '', mediaUrl || null]
        );
        
        const messageId = result.lastID;
        const savedMessage = await dbGet(
          `SELECT m.*, u.username, u.profile_pic 
           FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`,
          [messageId]
        );

        // Fetch thread members
        const members = await dbAll('SELECT user_id FROM thread_members WHERE thread_id = ?', [threadId]);

        // Broadcast to all active thread participants
        members.forEach(member => {
          if (clients.has(member.user_id)) {
            clients.get(member.user_id).forEach(clientWs => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: 'message',
                  message: savedMessage
                }));
              }
            });
          }
        });
      }

      else if (data.type === 'typing') {
        const { threadId, isTyping } = data;

        const members = await dbAll('SELECT user_id FROM thread_members WHERE thread_id = ? AND user_id != ?', [threadId, user.id]);
        members.forEach(member => {
          if (clients.has(member.user_id)) {
            clients.get(member.user_id).forEach(clientWs => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: 'typing',
                  threadId,
                  userId: user.id,
                  username: user.username,
                  isTyping
                }));
              }
            });
          }
        });
      }

      else if (data.type === 'reaction') {
        const { messageId, reaction } = data;
        const msg = await dbGet('SELECT thread_id FROM messages WHERE id = ?', [messageId]);
        if (!msg) return;

        // Update reaction
        await dbRun('UPDATE messages SET reaction = ? WHERE id = ?', [reaction || null, messageId]);

        // Broadcast reaction to thread members
        const members = await dbAll('SELECT user_id FROM thread_members WHERE thread_id = ?', [msg.thread_id]);
        members.forEach(member => {
          if (clients.has(member.user_id)) {
            clients.get(member.user_id).forEach(clientWs => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: 'reaction',
                  messageId,
                  reaction
                }));
              }
            });
          }
        });
      }

    } catch (e) {
      console.error('WebSocket msg error:', e);
    }
  });

  ws.on('close', () => {
    if (user && clients.has(user.id)) {
      clients.get(user.id).delete(ws);
      if (clients.get(user.id).size === 0) {
        clients.delete(user.id);
      }
    }
  });
});

// Upgrade WebSocket request
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Fallback: Default placeholder avatars if they don't exist
const ensureDefaultAvatar = () => {
  const avatarPath = path.join(__dirname, 'uploads/avatars/default.svg');
  if (!fs.existsSync(avatarPath)) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="hsl(240, 10%, 40%)"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z"/></svg>`;
    fs.writeFileSync(avatarPath, svgContent);
  }
};
ensureDefaultAvatar();

// Catch-all route to serve the SPA
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start Server
server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` ULink Express Server running on:`);
  console.log(` http://localhost:${PORT}`);
  console.log(`========================================`);
});
