import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreditCardBillStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateBillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ enum: CreditCardBillStatus })
  @IsOptional()
  @IsEnum(CreditCardBillStatus)
  status?: CreditCardBillStatus;
}

