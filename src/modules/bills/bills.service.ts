import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PayBillDto } from './dto/pay-bill.dto';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { CreditCardBillStatus, TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBillDto) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: dto.creditCardId, userId },
    });
    if (!card) throw new NotFoundException('Cartão não encontrado');
    return this.prisma.bill.create({
      data: {
        userId,
        creditCardId: dto.creditCardId,
        month: dto.month,
        year: dto.year,
        closingDate: new Date(dto.closingDate),
        dueDate: new Date(dto.dueDate),
        totalAmount: dto.totalAmount,
        paidAmount: dto.paidAmount ?? 0,
        status: dto.status ?? CreditCardBillStatus.OPEN,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.bill.findMany({
      where: { userId },
      orderBy: { year: 'desc' },
      include: { creditCard: true },
    });
  }

  async findByCard(userId: string, cardId: string) {
    return this.prisma.bill.findMany({
      where: { userId, creditCardId: cardId },
      orderBy: { year: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const bill = await this.prisma.bill.findFirst({ where: { id, userId } });
    if (!bill) throw new NotFoundException('Fatura não encontrada');
    return bill;
  }

  async update(userId: string, id: string, dto: UpdateBillDto) {
    await this.findOne(userId, id);
    return this.prisma.bill.update({
      where: { id },
      data: {
        closingDate: dto.closingDate ? new Date(dto.closingDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        totalAmount: dto.totalAmount,
        paidAmount: dto.paidAmount,
        status: dto.status,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.bill.delete({ where: { id } });
  }

  async pay(userId: string, billId: string, dto: PayBillDto) {
    const bill = await this.findOne(userId, billId);
    if (dto.amount <= 0) throw new BadRequestException('Valor inválido');
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId },
    });
    if (!account) throw new NotFoundException('Conta não encontrada');

    const newPaid = Number(bill.paidAmount) + dto.amount;
    if (newPaid > Number(bill.totalAmount)) {
      throw new BadRequestException('Valor excede total da fatura');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        description: `Pagamento fatura ${bill.month}/${bill.year}`,
        amount: dto.amount,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.POSTED,
        date: new Date(),
        accountId: dto.accountId,
        creditCardId: bill.creditCardId,
        billId: bill.id,
      },
    });

    await this.prisma.account.update({
      where: { id: dto.accountId },
      data: { currentBalance: { decrement: dto.amount } },
    });

    const updatedBill = await this.prisma.bill.update({
      where: { id: bill.id },
      data: {
        paidAmount: newPaid,
        status: newPaid === Number(bill.totalAmount) ? CreditCardBillStatus.PAID : bill.status,
      },
    });

    const card = await this.prisma.creditCard.findUnique({ where: { id: bill.creditCardId } });
    if (card) {
      const updatedLimit = Math.min(
        Number(card.limitTotal),
        Number(card.limitAvailable) + dto.amount,
      );
      await this.prisma.creditCard.update({
        where: { id: card.id },
        data: { limitAvailable: updatedLimit },
      });
    }

    return { bill: updatedBill, transaction };
  }
}

