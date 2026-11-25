const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../db');

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
  password: z.string().min(10).max(128),
  phone: z.string().max(30).optional()
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email.toLowerCase(), passwordHash, phone: data.phone },
      select: { id: true, name: true, email: true, role: true }
    });
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').toLowerCase();
    const password = String(req.body.password || '');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h', issuer: 'onestep-api', audience: 'onestep-web' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
});
module.exports = router;
