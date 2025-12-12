const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(express.json());

// lowdb setup
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDB(){
  await db.read();
  db.data ||= { users: [], items: [] };
  await db.write();
}
initDB();

// CORS allowing credentials from frontend dev server (http://localhost:5173)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: 'replace-this-secret-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true } // secure:true requires HTTPS
}));

// Signup (store plaintext password — as requested)
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const exists = db.data.users.find(u => u.username === username);
  if (exists) return res.status(400).json({ error: 'user exists' });
  const user = { id: nanoid(), username, password }; // plaintext intentionally
  db.data.users.push(user);
  await db.write();
  // set session
  req.session.userId = user.id;
  res.json({ success: true, user: { id: user.id, username: user.username } });
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  req.session.userId = user.id;
  res.json({ success: true, user: { id: user.id, username: user.username } });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Get current user
app.get('/api/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  await db.read();
  const user = db.data.users.find(u => u.id === req.session.userId);
  if (!user) return res.json({ user: null });
  res.json({ user: { id: user.id, username: user.username } });
});

// Middleware to require auth
async function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'not authenticated' });
  await db.read();
  const user = db.data.users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json({ error: 'not authenticated' });
  req.user = user;
  next();
}

// Basic CRUD for items (example resource)
app.get('/api/items', requireAuth, async (req, res) => {
  await db.read();
  // return only the items created by this user
  const items = db.data.items.filter(i => i.ownerId === req.user.id);
  res.json(items);
});
app.post('/api/items', requireAuth, async (req, res) => {
  const { title, content } = req.body;
  await db.read();
  const item = { id: nanoid(), ownerId: req.user.id, title, content, createdAt: Date.now() };
  db.data.items.push(item);
  await db.write();
  res.json(item);
});
app.put('/api/items/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  await db.read();
  const item = db.data.items.find(i => i.id === id && i.ownerId === req.user.id);
  if (!item) return res.status(404).json({ error: 'not found' });
  item.title = req.body.title ?? item.title;
  item.content = req.body.content ?? item.content;
  await db.write();
  res.json(item);
});
app.delete('/api/items/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  await db.read();
  const idx = db.data.items.findIndex(i => i.id === id && i.ownerId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.data.items.splice(idx,1);
  await db.write();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
