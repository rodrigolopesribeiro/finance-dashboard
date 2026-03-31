import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateCreditCardDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  institution: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  limitTotal: number;

  @ApiProperty({ description: 'Dia de fechamento (1-28)' })
  @IsInt()
  @Min(1)
  @Max(28)
  closingDay: number;

  @ApiProperty({ description: 'Dia de vencimento (1-28)' })
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay: number;
}


