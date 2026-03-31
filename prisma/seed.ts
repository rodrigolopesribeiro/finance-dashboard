import { PrismaClient, CategoryType, AccountType, TransactionType, TransactionStatus, CreditCardBillStatus, GoalStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Juliana21!', 10);

  const user = await prisma.user.create({
    data: {
      name: 'Lucas Ferreira',
      email: 'lucas@email.com',
      passwordHash,
    },
  });

  const categories = await prisma.category.createMany({
    data: [
      { name: 'Salário', type: CategoryType.INCOME, isSystem: true },
      { name: 'Freelance', type: CategoryType.INCOME, isSystem: true },
      { name: 'Moradia', type: CategoryType.EXPENSE, isSystem: true },
      { name: 'Alimentação', type: CategoryType.EXPENSE, isSystem: true },
      { name: 'Transporte', type: CategoryType.EXPENSE, isSystem: true },
      { name: 'Saúde', type: CategoryType.EXPENSE, isSystem: true },
      { name: 'Lazer', type: CategoryType.EXPENSE, isSystem: true },
      { name: 'Assinaturas', type: CategoryType.EXPENSE, isSystem: true },
      { name: 'Educação', type: CategoryType.EXPENSE, isSystem: true },
      { name: 'Pagamento de Cartão', type: CategoryType.EXPENSE, isSystem: true },
    ],
  });

  const allCategories = await prisma.category.findMany();
  const categoryByName = (name: string) => allCategories.find((c) => c.name === name)?.id;

  const checking = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Conta Corrente',
      type: AccountType.CHECKING,
      initialBalance: 3000,
      currentBalance: 5700,
    },
  });

  const savings = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Poupança',
      type: AccountType.SAVINGS,
      initialBalance: 10000,
      currentBalance: 10000,
    },
  });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        description: 'Salário',
        amount: 5000,
        type: TransactionType.INCOME,
        status: TransactionStatus.POSTED,
        date: new Date(year, month - 1, 5),
        accountId: checking.id,
        categoryId: categoryByName('Salário'),
      },
      {
        userId: user.id,
        description: 'Projeto freelance',
        amount: 1200,
        type: TransactionType.INCOME,
        status: TransactionStatus.POSTED,
        date: new Date(year, month - 1, 12),
        accountId: checking.id,
        categoryId: categoryByName('Freelance'),
      },
      {
        userId: user.id,
        description: 'Aluguel',
        amount: 1800,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.POSTED,
        date: new Date(year, month - 1, 8),
        accountId: checking.id,
        categoryId: categoryByName('Moradia'),
      },
      {
        userId: user.id,
        description: 'Mercado',
        amount: 600,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.POSTED,
        date: new Date(year, month - 1, 10),
        accountId: checking.id,
        categoryId: categoryByName('Alimentação'),
      },
      {
        userId: user.id,
        description: 'Transporte',
        amount: 300,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.POSTED,
        date: new Date(year, month - 1, 15),
        accountId: checking.id,
        categoryId: categoryByName('Transporte'),
      },
      {
        userId: user.id,
        description: 'Streaming',
        amount: 50,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.POSTED,
        date: new Date(year, month - 1, 18),
        accountId: checking.id,
        categoryId: categoryByName('Assinaturas'),
      },
      {
        userId: user.id,
        description: 'Lazer',
        amount: 250,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.POSTED,
        date: new Date(year, month - 1, 20),
        accountId: checking.id,
        categoryId: categoryByName('Lazer'),
      },
    ],
  });

  const card = await prisma.creditCard.create({
    data: {
      userId: user.id,
      name: 'Cartão Principal',
      institution: 'Banco XPTO',
      limitTotal: 8000,
      limitAvailable: 7640,
      closingDay: 25,
      dueDay: 5,
    },
  });

  const bill = await prisma.bill.create({
    data: {
      userId: user.id,
      creditCardId: card.id,
      month,
      year,
      closingDate: new Date(year, month - 1, 25),
      dueDate: new Date(year, month - 1, 5),
      totalAmount: 360,
      paidAmount: 200,
      status: CreditCardBillStatus.OPEN,
    },
  });

  await prisma.cardTransaction.createMany({
    data: [
      {
        userId: user.id,
        creditCardId: card.id,
        billId: bill.id,
        description: 'Restaurante',
        amount: 120,
        date: new Date(year, month - 1, 9),
        categoryId: categoryByName('Alimentação'),
      },
      {
        userId: user.id,
        creditCardId: card.id,
        billId: bill.id,
        description: 'Combustível',
        amount: 200,
        date: new Date(year, month - 1, 14),
        categoryId: categoryByName('Transporte'),
      },
      {
        userId: user.id,
        creditCardId: card.id,
        billId: bill.id,
        description: 'Streaming anual',
        amount: 40,
        date: new Date(year, month - 1, 3),
        categoryId: categoryByName('Assinaturas'),
      },
    ],
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      description: `Pagamento fatura ${month}/${year}`,
      amount: 200,
      type: TransactionType.EXPENSE,
      status: TransactionStatus.POSTED,
      date: new Date(year, month - 1, 22),
      accountId: checking.id,
      categoryId: categoryByName('Pagamento de Cartão'),
      creditCardId: card.id,
      billId: bill.id,
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        name: 'Reserva de emergência',
        targetAmount: 20000,
        currentAmount: 8000,
        status: GoalStatus.ACTIVE,
      },
      {
        userId: user.id,
        name: 'Viagem 2026',
        targetAmount: 5000,
        currentAmount: 1500,
        status: GoalStatus.ACTIVE,
      },
    ],
  });

  console.log('Seed concluído');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


