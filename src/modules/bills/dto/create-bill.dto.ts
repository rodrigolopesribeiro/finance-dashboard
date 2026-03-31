import { ApiProperty } from '@nestjs/swagger';
import { CreditCardBillStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBillDto {
  @ApiProperty()
  @IsString()
  creditCardId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty()
  @IsInt()
  @Min(2000)
  year: number;

  @ApiProperty()
  @IsDateString()
  closingDate: string;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiProperty({ enum: CreditCardBillStatus, required: false })
  @IsOptional()
  @IsEnum(CreditCardBillStatus)
  status?: CreditCardBillStatus;
}

