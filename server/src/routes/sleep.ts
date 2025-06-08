import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@lib/prisma';
import { getWeek, startOfWeek, endOfWeek, format } from 'date-fns';

interface SleepEntry {
  id: string;
  startTime: Date;
  endTime: Date;
  note: string | null;
}

const sleepSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  note: z.string().optional(),
});

export async function sleepRoutes(app: FastifyInstance) {
  // 수면 기록 생성
  app.post('/sleep', async (request, reply) => {
    const { startTime, endTime, note } = sleepSchema.parse(request.body);

    // 수면 시간 유효성 검증
    if (new Date(startTime) >= new Date(endTime)) {
      return reply.status(400).send({
        error: '수면 시작 시간은 종료 시간보다 이전이어야 합니다.',
      });
    }

    // 중복 수면 시간 유효성 검증
    const overlappingSleeps = await prisma.sleep.findMany({
      where: {
        OR: [
          {
            startTime: {
              lt: new Date(endTime),
            },
            endTime: {
              gt: new Date(startTime),
            },
          },
        ],
      },
    });

    if (overlappingSleeps.length > 0) {
      return reply.status(400).send({
        error: '이미 해당 시간에 다른 수면 기록이 존재합니다.',
      });
    }

    const sleep = await prisma.sleep.create({
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        note,
      },
    });

    return reply.status(201).send(sleep);
  });

  // 수면 기록 목록 조회
  app.get('/sleep', async () => {
    const sleeps = await prisma.sleep.findMany({
      orderBy: {
        startTime: 'desc',
      },
    });

    return sleeps;
  });

  // 수면 통계 조회 (지난 7일간의 평균 수면 시간 및 기록 횟수)
  app.get('/sleep/stats', async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sleepStats = await prisma.sleep.findMany({
      where: {
        startTime: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const dailyStats: { [key: string]: { totalDuration: number, count: number } } = {};

    sleepStats.forEach((sleep: SleepEntry) => {
      const dateKey = sleep.startTime.toISOString().split('T')[0];
      const duration = (sleep.endTime.getTime() - sleep.startTime.getTime()) / (1000 * 60 * 60); // 시간을 시간 단위로

      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { totalDuration: 0, count: 0 };
      }
      dailyStats[dateKey].totalDuration += duration;
      dailyStats[dateKey].count += 1;
    });

    const formattedStats = Object.keys(dailyStats).sort().map(dateKey => ({
      date: dateKey,
      averageDuration: dailyStats[dateKey].totalDuration / dailyStats[dateKey].count,
      sleepCount: dailyStats[dateKey].count,
    }));

    return formattedStats;
  });

  // 주별 총 수면 시간 조회
  app.get('/sleep/stats/weekly-duration', async () => {
    const allSleeps = await prisma.sleep.findMany({
      orderBy: {
        startTime: 'asc',
      },
    });

    const weeklyStats: { [key: string]: { totalDuration: number, weekStart: Date } } = {};

    allSleeps.forEach((sleep: SleepEntry) => {
      const weekStart = startOfWeek(sleep.startTime, { weekStartsOn: 0 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      const duration = (sleep.endTime.getTime() - sleep.startTime.getTime()) / (1000 * 60 * 60);

      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = { totalDuration: 0, weekStart: weekStart };
      }
      weeklyStats[weekKey].totalDuration += duration;
    });

    const formattedWeeklyStats = Object.keys(weeklyStats).sort().map(weekKey => ({
      week: format(weeklyStats[weekKey].weekStart, 'yyyy-MM-dd'),
      totalDuration: weeklyStats[weekKey].totalDuration,
    }));

    return formattedWeeklyStats;
  });

  // 수면 시간대별 분포 조회
  app.get('/sleep/stats/hour-distribution', async () => {
    const allSleeps = await prisma.sleep.findMany({
      orderBy: {
        startTime: 'asc',
      },
    });

    const hourDistribution: { [key: string]: { starts: number, ends: number } } = {};
    for (let i = 0; i < 24; i++) {
      const hourKey = String(i).padStart(2, '0');
      hourDistribution[hourKey] = { starts: 0, ends: 0 };
    }

    allSleeps.forEach((sleep: SleepEntry) => {
      const startHour = new Date(sleep.startTime).getHours();
      const endHour = new Date(sleep.endTime).getHours();

      hourDistribution[String(startHour).padStart(2, '0')].starts += 1;
      hourDistribution[String(endHour).padStart(2, '0')].ends += 1;
    });

    const formattedDistribution = Object.keys(hourDistribution).sort().map(hourKey => ({
      hour: hourKey,
      starts: hourDistribution[hourKey].starts,
      ends: hourDistribution[hourKey].ends,
    }));

    return formattedDistribution;
  });

  // 수면 기록 업데이트
  app.put('/sleep/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { startTime, endTime, note } = sleepSchema.parse(request.body);

    // 수면 시간 유효성 검증
    if (new Date(startTime) >= new Date(endTime)) {
      return reply.status(400).send({
        error: '수면 시작 시간은 종료 시간보다 이전이어야 합니다.',
      });
    }

    // 중복 수면 시간 유효성 검증 (현재 수정 중인 기록 제외)
    const overlappingSleeps = await prisma.sleep.findMany({
      where: {
        id: {
          not: id, // 현재 업데이트 중인 기록 제외
        },
        OR: [
          {
            startTime: {
              lt: new Date(endTime),
            },
            endTime: {
              gt: new Date(startTime),
            },
          },
        ],
      },
    });

    if (overlappingSleeps.length > 0) {
      return reply.status(400).send({
        error: '이미 해당 시간에 다른 수면 기록이 존재합니다.',
      });
    }

    try {
      const sleep = await prisma.sleep.update({
        where: { id },
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          note,
        },
      });

      return sleep;
    } catch (error) {
      return reply.status(404).send({
        error: '해당 수면 기록을 찾을 수 없습니다.',
      });
    }
  });

  // 수면 기록 삭제
  app.delete('/sleep/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    try {
      await prisma.sleep.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error) {
      return reply.status(404).send({
        error: '해당 수면 기록을 찾을 수 없습니다.',
      });
    }
  });
} 