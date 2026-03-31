import { Module } from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { CreditCardsController } from './credit-cards.controller';
import { BillsModule } from '../bills/bills.module';

@Module({
  imports: [BillsModule],
  providers: [CreditCardsService],
  controllers: [CreditCardsController],
})
export class CreditCardsModule {}


