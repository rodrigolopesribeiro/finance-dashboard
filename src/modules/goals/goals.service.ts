import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({ data: { ...dto, userId } });
  }

  async findAll(userId: string) {
    const goals = await this.prisma.goal.findMany({ where: { userId } });
    return goals.map((goal) => {
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);
      const percent = target > 0 ? Math.round((current / target) * 100) : 0;
      return {
        ...goal,
        progressPercent: percent,
        remainingAmount: Math.max(target - current, 0),
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Meta não encontrada');
    return this.prisma.goal.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Meta não encontrada');
    return this.prisma.goal.delete({ where: { id } });
  }
}


