const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    ['Plumbing', 'Tap, pipe and bathroom repairs', 499],
    ['Electrical', 'Fans, lights and wiring services', 599],
    ['Home Cleaning', 'Deep cleaning and regular cleaning', 999],
    ['AC Service', 'AC inspection and maintenance', 799],
    ['Painting', 'Interior and exterior painting', 1499]
  ];
  for (const [name, description, basePrice] of categories) {
    await prisma.serviceCategory.upsert({
      where: { name },
      update: { description, basePrice },
      create: { name, description, basePrice }
    });
  }
}
main().finally(() => prisma.$disconnect());
