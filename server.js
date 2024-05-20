const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fake DB
const db = {
  users: [{ id: 1, email: 'testmail@gmail.com', password: '123456', name: 'User 1' }],
  post: [
    { id: 1, title: 'Title 1', description: 'Description 1' },
    { id: 2, title: 'Title 2', description: 'Description 2' },
    { id: 3, title: 'Title 3', description: 'Description 3' },
  ],
};

// Session
const sessions = {};

// [POST] /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const user = db.users.find((x) => x.email === email && x.password === password);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const sessionId = uuidv4();
  sessions[sessionId] = { sub: user.id };

  res
    .setHeader(
      'Set-Cookie',
      `sessionId=${sessionId}; HttpOnly; Max-Age=3600; SameSite=None; Secure; Partitioned`
    )
    .json(user);
});

// [GET] /api/auth/logout
app.get('/api/auth/logout', (req, res) => {
  delete sessions[req.cookies.sessionId];
  res.setHeader('Set-Cookie', `sessionId=; Max-Age=0; SameSite=None; Secure; Partitioned`).json();
});

// [GET] /api/auth/me
app.get('/api/auth/me', (req, res) => {
  const session = sessions[req.cookies.sessionId];
  if (!session) return res.status(401).json({ message: 'Unauthorized' });

  const user = db.users.find((x) => (x.id = session.sub));
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  res.json(user);
});

https
  .createServer(
    {
      key: fs.readFileSync('testcookie.com+2-key.pem'),
      cert: fs.readFileSync('testcookie.com+2.pem'),
    },
    app
  )
  .listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
