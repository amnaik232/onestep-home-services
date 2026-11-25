const router = require('express').Router();
const prisma = require('../db');

router.get('/', async (_req, res, next) => {
  try {
    const services = await prisma.serviceCategory.findMany({
      where: { active: true }, orderBy: { name: 'asc' }
    });
    res.json({ services });
  } catch (err) { next(err); }
});
module.exports = router;
