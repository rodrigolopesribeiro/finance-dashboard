import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TransactionStatus, TransactionType, CreditCardBillStatus, GoalStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, monthStr?: string, yearStr?: string) {
    const now = new Date();
    const month = monthStr ? Number(monthStr) : now.getMonth() + 1;
    const year = yearStr ? Number(yearStr) : now.getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { currentBalance: true },
    });
    const balance = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);

    const [incomeAgg, expenseAgg, cardExpenseAgg] = await this.prisma.$transaction([
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.INCOME,
          status: TransactionStatus.POSTED,
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.POSTED,
          date: { gte: start, lte: end },
          billId: null,
        },
        _sum: { amount: true },
      }),
      this.prisma.cardTransaction.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    const income = Number(incomeAgg._sum.amount || 0);
    const expense =
      Number(expenseAgg._sum.amount || 0) + Number(cardExpenseAgg._sum.amount || 0);

    const currentBill = await this.prisma.bill.findFirst({
      where: { userId, month, year, status: { in: [CreditCardBillStatus.OPEN, CreditCardBillStatus.CLOSED] } },
      orderBy: { createdAt: 'desc' },
    });

    const goals = await this.prisma.goal.findMany({
      where: { userId, status: GoalStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });

    const lastBankTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const lastCardTransactions = await this.prisma.cardTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const lastTransactions = [...lastBankTransactions, ...lastCardTransactions]
      .map((item) => ({ ...item, source: 'accountId' in item ? 'bank' : 'card' }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const expensesByCategoryBank = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.POSTED,
        date: { gte: start, lte: end },
        categoryId: { not: null },
        billId: null,
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const expensesByCategoryCard = await this.prisma.cardTransaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: { gte: start, lte: end },
        categoryId: { not: null },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const categoryIds = [
      ...expensesByCategoryBank.map((e) => e.categoryId as string),
      ...expensesByCategoryCard.map((e) => e.categoryId as string),
    ];

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const mergeMap = new Map<string, number>();
    for (const item of expensesByCategoryBank) {
      const key = item.categoryId as string;
      mergeMap.set(key, (mergeMap.get(key) || 0) + Number(item._sum.amount || 0));
    }
    for (const item of expensesByCategoryCard) {
      const key = item.categoryId as string;
      mergeMap.set(key, (mergeMap.get(key) || 0) + Number(item._sum.amount || 0));
    }

    const expensesByCategoryMapped = Array.from(mergeMap.entries()).map(
      ([categoryId, total]) => {
        const category = categories.find((c) => c.id === categoryId);
        return { categoryId, categoryName: category?.name || 'Sem categoria', total };
      },
    );

    return {
      month,
      year,
      balance,
      income,
      expense,
      currentBill: currentBill
        ? {
            id: currentBill.id,
            total: Number(currentBill.totalAmount),
            paid: Number(currentBill.paidAmount),
            dueDate: currentBill.dueDate,
            status: currentBill.status,
          }
        : null,
      goals,
      lastTransactions,
      expensesByCategory: expensesByCategoryMapped,
    };
  }
}


