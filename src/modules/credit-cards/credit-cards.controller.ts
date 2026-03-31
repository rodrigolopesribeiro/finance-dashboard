import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { CreateCardTransactionDto } from './dto/create-card-transaction.dto';
import { BillsService } from '../bills/bills.service';

@ApiTags('credit-cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credit-cards')
export class CreditCardsController {
  constructor(
    private readonly creditCardsService: CreditCardsService,
    private readonly billsService: BillsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateCreditCardDto,
  ) {
    return this.creditCardsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.creditCardsService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.creditCardsService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateCreditCardDto,
  ) {
    return this.creditCardsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.creditCardsService.remove(user.userId, id);
  }

  @Get(':id/bills')
  listBills(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.billsService.findByCard(user.userId, id);
  }

  @Post(':id/transactions')
  addTransaction(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: CreateCardTransactionDto,
  ) {
    return this.creditCardsService.addTransaction(user.userId, id, dto);
  }

  @Get(':id/transactions')
  listTransactions(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.creditCardsService.listTransactions(user.userId, id);
  }
}


