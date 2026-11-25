const app = require('./app');
const prisma = require('./db');
const port = Number(process.env.PORT || 5000);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`OneStep API listening on ${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
