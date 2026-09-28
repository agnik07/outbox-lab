import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'outbox-secret-key-2026';

// Demo user credentials
const DEMO_USER = {
  username: process.env.DEMO_USER || 'admin',
  password: process.env.DEMO_PASSWORD || 'password123',
  name: 'Mitrajit',
  email: 'mitrajit@outbox-lab.internal'
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === DEMO_USER.username && password === DEMO_USER.password) {
    const token = jwt.sign(
      { username: DEMO_USER.username, name: DEMO_USER.name, email: DEMO_USER.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        username: DEMO_USER.username,
        name: DEMO_USER.name,
        email: DEMO_USER.email
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password'
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

export default router;
