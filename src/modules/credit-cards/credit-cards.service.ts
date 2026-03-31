import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { CreateCardTransactionDto } from './dto/create-card-transaction.dto';

@Injectable()
export class CreditCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCreditCardDto) {
    return this.prisma.creditCard.create({
      data: {
        userId,
        name: dto.name,
        institution: dto.institution,
        limitTotal: dto.limitTotal,
        limitAvailable: dto.limitTotal,
        closingDay: dto.closingDay,
        dueDay: dto.dueDay,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.creditCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const card = await this.prisma.creditCard.findFirst({ where: { id, userId } });
    if (!card) throw new NotFoundException('Cartão não encontrado');
    return card;
  }

  async update(userId: string, id: string, dto: UpdateCreditCardDto) {
    await this.findOne(userId, id);
    return this.prisma.creditCard.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.creditCard.delete({ where: { id } });
  }

  async addTransaction(userId: string, cardId: string, dto: CreateCardTransactionDto) {
    const card = await this.findOne(userId, cardId);
    const date = new Date(dto.date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const bill = await this.getOrCreateBill(userId, card, month, year);

    const created = await this.prisma.cardTransaction.create({
      data: {
        userId,
        creditCardId: cardId,
        billId: bill.id,
        description: dto.description,
        amount: dto.amount,
        date,
        categoryId: dto.categoryId,
      },
    });

    await this.prisma.bill.update({
      where: { id: bill.id },
      data: { totalAmount: { increment: dto.amount } },
    });

    await this.prisma.creditCard.update({
      where: { id: cardId },
      data: { limitAvailable: { decrement: dto.amount } },
    });

    return created;
  }

  async listTransactions(userId: string, cardId: string) {
    await this.findOne(userId, cardId);
    return this.prisma.cardTransaction.findMany({
      where: { userId, creditCardId: cardId },
      orderBy: { date: 'desc' },
    });
  }

  private async getOrCreateBill(userId: string, card: any, month: number, year: number) {
    const existing = await this.prisma.bill.findUnique({
      where: { creditCardId_month_year: { creditCardId: card.id, month, year } },
    });
    if (existing) return existing;

    const closingDate = new Date(year, month - 1, card.closingDay);
    const dueDate = new Date(year, month - 1, card.dueDay);

    return this.prisma.bill.create({
      data: {
        userId,
        creditCardId: card.id,
        month,
        year,
        closingDate,
        dueDate,
        totalAmount: 0,
      },
    });
  }
}


