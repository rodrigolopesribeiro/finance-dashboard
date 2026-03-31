const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('Juliana21!', 10);
  const user = await prisma.user.update({
    where: { email: 'lucas@email.com' },
    data: { passwordHash: hash },
  });
  console.log('Senha atualizada para', user.email);
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
