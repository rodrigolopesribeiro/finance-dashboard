import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';
import { getPagination } from '../../common/utils/pagination';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.type === TransactionType.TRANSFER && !dto.toAccountId) {
      throw new BadRequestException('Transferência exige conta de destino');
    }
    await this.ensureAccountOwnership(userId, dto.accountId);
    if (dto.toAccountId) {
      await this.ensureAccountOwnership(userId, dto.toAccountId);
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        status: dto.status ?? TransactionStatus.POSTED,
        date: new Date(dto.date),
        accountId: dto.accountId,
        toAccountId: dto.toAccountId,
        categoryId: dto.categoryId,
        notes: dto.notes,
      },
    });

    if (transaction.status === TransactionStatus.POSTED) {
      await this.applyBalanceChange(transaction, 1);
    }

    return transaction;
  }

  async findAll(userId: string, query: FindTransactionsDto) {
    const { take, skip } = getPagination(query.page, query.pageSize);
    const where: any = { userId };

    if (query.accountId) where.accountId = query.accountId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }
    if (query.search) {
      where.description = { contains: query.search, mode: 'insensitive' };
    }

    const sortDir = (query.sortDir ?? 'desc') as Prisma.SortOrder;
    const orderBy: Prisma.TransactionOrderByWithRelationInput = query.sortBy
      ? ({ [query.sortBy]: sortDir } as Prisma.TransactionOrderByWithRelationInput)
      : { date: 'desc' as Prisma.SortOrder };

    const summaryWhere = { ...where } as any;
    if (query.type) {
      delete summaryWhere.type;
    }

    const [items, total, incomeAggregate, expenseAggregate] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        take,
        skip,
        orderBy,
      }),
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.aggregate({
        where: { ...summaryWhere, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...summaryWhere, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    const incomeTotal = Number(incomeAggregate._sum.amount ?? 0);
    const expenseTotal = Number(expenseAggregate._sum.amount ?? 0);

    return {
      items,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      summary: {
        income: incomeTotal,
        expense: expenseTotal,
        net: incomeTotal - expenseTotal,
        count: total,
      },
    };
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Transação não encontrada');

    const accountId = dto.accountId ?? existing.accountId;
    const toAccountId = dto.toAccountId ?? existing.toAccountId;
    const type = dto.type ?? existing.type;
    if (type === TransactionType.TRANSFER && !toAccountId) {
      throw new BadRequestException('Transferência exige conta de destino');
    }
    await this.ensureAccountOwnership(userId, accountId);
    if (toAccountId) await this.ensureAccountOwnership(userId, toAccountId);

    if (existing.status === TransactionStatus.POSTED) {
      await this.applyBalanceChange(existing, -1);
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        description: dto.description ?? existing.description,
        amount: dto.amount ?? existing.amount,
        type: dto.type ?? existing.type,
        status: dto.status ?? existing.status,
        date: dto.date ? new Date(dto.date) : existing.date,
        accountId: dto.accountId ?? existing.accountId,
        toAccountId: dto.toAccountId ?? existing.toAccountId,
        categoryId: dto.categoryId ?? existing.categoryId,
        notes: dto.notes ?? existing.notes,
      },
    });

    if (updated.status === TransactionStatus.POSTED) {
      await this.applyBalanceChange(updated, 1);
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Transação não encontrada');

    if (existing.status === TransactionStatus.POSTED) {
      await this.applyBalanceChange(existing, -1);
    }

    return this.prisma.transaction.delete({ where: { id } });
  }

  private async applyBalanceChange(transaction: any, factor: 1 | -1) {
    const amount = Number(transaction.amount);

    if (transaction.type === TransactionType.INCOME) {
      await this.prisma.account.update({
        where: { id: transaction.accountId },
        data: { currentBalance: { increment: amount * factor } },
      });
      return;
    }

    if (transaction.type === TransactionType.EXPENSE) {
      await this.prisma.account.update({
        where: { id: transaction.accountId },
        data: { currentBalance: { decrement: amount * factor } },
      });
      return;
    }

    if (transaction.type === TransactionType.TRANSFER) {
      if (!transaction.toAccountId) {
        throw new BadRequestException('Transferência exige conta de destino');
      }
      await this.prisma.account.update({
        where: { id: transaction.accountId },
        data: { currentBalance: { decrement: amount * factor } },
      });
      await this.prisma.account.update({
        where: { id: transaction.toAccountId },
        data: { currentBalance: { increment: amount * factor } },
      });
    }
  }

  private async ensureAccountOwnership(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundException('Conta não encontrada');
  }
}


