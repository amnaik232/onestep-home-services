const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const requestSchema = z.object({
  categoryId: z.string().min(1),
  address: z.string().min(8).max(500),
  preferredDate: z.iso.datetime(),
  notes: z.string().max(1000).optional()
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = requestSchema.parse(req.body);
    const category = await prisma.serviceCategory.findFirst({
      where: { id: data.categoryId, active: true }
    });
    if (!category) return res.status(404).json({ error: 'Service category not found' });
    const request = await prisma.serviceRequest.create({
      data: {
        customerId: req.user.sub,
        categoryId: data.categoryId,
        address: data.address,
        preferredDate: new Date(data.preferredDate),
        notes: data.notes
      },
      include: { category: true }
    });
    res.status(201).json({ request });
  } catch (err) { next(err); }
});

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { customerId: req.user.sub },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ requests });
  } catch (err) { next(err); }
});
module.exports = router;
