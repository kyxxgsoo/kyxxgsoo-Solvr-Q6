import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getWeek, startOfWeek, endOfWeek, format, parseISO, differenceInHours } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

interface SleepEntry {
  id: string;
  startTime: Date;
  endTime: Date;
  note: string | null;
}

// 수면 기록 생성 스키마
const createSleepSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  note: z.string().optional(),
});

// 수면 기록 수정 스키마
const updateSleepSchema = createSleepSchema;

// AI 조언 요청 스키마 (클라이언트에서 보낼 데이터 구조에 맞춰 정의)
const sleepAdviceSchema = z.object({
  sleeps: z.array(z.object({
    id: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    note: z.string().nullable().optional(),
  })),
  sleepStats: z.array(z.any()), // 더 구체적인 스키마로 대체 가능
  weeklySleepStats: z.array(z.any()), // 더 구체적인 스키마로 대체 가능
  hourDistributionStats: z.array(z.any()), // 더 구체적인 스키마로 대체 가능
});

// 현재 시간 이전인지 확인하는 함수
const isBeforeNow = (date: Date) => {
  // Invalid Date 객체는 항상 현재 시간보다 작지 않으므로, 유효성 검사에서 걸러짐
  return date instanceof Date && !isNaN(date.getTime()) && date < new Date();
};

// 수면 시간 중복 체크 함수
const checkSleepTimeOverlap = async (startTime: Date, endTime: Date, excludeId?: string) => {
  const existingSleep = await prisma.sleep.findFirst({
    where: {
      AND: [
        {
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ],
            },
          ],
        },
        ...(excludeId ? [{ id: { not: excludeId } }] : []),
      ],
    },
  });

  return !!existingSleep;
};

export async function sleepRoutes(app: FastifyInstance) {
  // 수면 기록 생성
  app.post('/sleep', async (request, reply) => {
    try {
      const { startTime, endTime, note } = createSleepSchema.parse(request.body);

      const start = parseISO(startTime);
      const end = parseISO(endTime);

      // Invalid Date 체크
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return reply.status(400).send({ error: '유효하지 않은 날짜/시간 형식입니다.' });
      }

      // 시작 시간이 종료 시간보다 이후인 경우
      if (start >= end) {
        return reply.status(400).send({ error: '수면 종료 시간은 시작 시간보다 이후여야 합니다.' });
      }

      // 현재 시간보다 이후인 경우
      if (!isBeforeNow(start) || !isBeforeNow(end)) {
        return reply.status(400).send({ error: '수면 시작/종료 시간은 현재 시간보다 이후일 수 없습니다.' });
      }

      // 수면 시간 중복 체크
      const hasOverlap = await checkSleepTimeOverlap(start, end);
      if (hasOverlap) {
        return reply.status(400).send({ error: '해당 시간대에 이미 수면 기록이 존재합니다.' });
      }

      const sleep = await prisma.sleep.create({
        data: {
          startTime: start,
          endTime: end,
          note,
        },
      });

      return reply.status(201).send(sleep);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(issue => `필드: ${issue.path.join('.')}, 오류: ${issue.message}`).join('; ');
        return reply.status(400).send({ error: `데이터 유효성 검사 실패: ${errors}` });
      } else {
        console.error('Error creating sleep record:', error);
        return reply.status(500).send({ error: '서버 오류가 발생했습니다.' });
      }
    }
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
    try {
      const { id } = request.params as { id: string };
      const { startTime, endTime, note } = updateSleepSchema.parse(request.body);

      const start = parseISO(startTime);
      const end = parseISO(endTime);

      // Invalid Date 체크
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return reply.status(400).send({ error: '유효하지 않은 날짜/시간 형식입니다.' });
      }

      // 시작 시간이 종료 시간보다 이후인 경우
      if (start >= end) {
        return reply.status(400).send({ error: '수면 종료 시간은 시작 시간보다 이후여야 합니다.' });
      }

      // 현재 시간보다 이후인 경우
      if (!isBeforeNow(start) || !isBeforeNow(end)) {
        return reply.status(400).send({ error: '수면 시작/종료 시간은 현재 시간보다 이후일 수 없습니다.' });
      }

      // 수면 시간 중복 체크 (자기 자신 제외)
      const hasOverlap = await checkSleepTimeOverlap(start, end, id);
      if (hasOverlap) {
        return reply.status(400).send({ error: '해당 시간대에 이미 수면 기록이 존재합니다.' });
      }

      const sleep = await prisma.sleep.update({
        where: { id },
        data: {
          startTime: start,
          endTime: end,
          note,
        },
      });

      return reply.status(200).send(sleep);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(issue => `필드: ${issue.path.join('.')}, 오류: ${issue.message}`).join('; ');
        return reply.status(400).send({ error: `데이터 유효성 검사 실패: ${errors}` });
      } else {
        console.error('Error updating sleep record:', error);
        return reply.status(500).send({ error: '서버 오류가 발생했습니다.' });
      }
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

  // AI 수면 조언 생성
  app.post('/sleep/advice', async (request, reply) => {
    try {
      // 요청 본문의 유효성 검사
      const { sleeps, sleepStats, weeklySleepStats, hourDistributionStats } = sleepAdviceSchema.parse(request.body);

      if (!process.env.GEMINI_API_KEY) {
        return reply.status(500).send({ error: 'Gemini API 키가 설정되지 않았습니다.' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const modelName = 'gemma-3-1b-it'; // 사용자 제공 코드에서 확인된 모델 이름

      const promptText = `사용자의 최근 수면 기록 데이터는 다음과 같습니다: ${JSON.stringify({ sleeps, sleepStats, weeklySleepStats, hourDistributionStats })}. 이 데이터를 바탕으로 사용자의 수면 상태를 진단하고, 건강한 수면을 위한 구체적이고 실용적인 조언을 제공해 주세요. 조언은 친근하고 격려하는 어조로 작성해 주세요.`;
      
      const contents = [
        {
          role: 'user',
          parts: [
            { text: promptText },
          ],
        },
      ];

      // generateContentStream 사용
      const result = await ai.models.generateContentStream({
        model: modelName,
        contents: contents,
      });

      let collectedText = '';
      for await (const chunk of result) {
        collectedText += chunk.text;
      }

      return reply.status(200).send({ advice: collectedText });
    } catch (error) {
      console.error('Error generating AI advice:', error);
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(issue => `필드: ${issue.path.join('.')}, 오류: ${issue.message}`).join('; ');
        return reply.status(400).send({ error: `데이터 유효성 검사 실패: ${errors}` });
      } else {
        return reply.status(500).send({ error: 'AI 조언 생성에 실패했습니다. 입력 데이터를 확인하거나 나중에 다시 시도해 주세요.' });
      }
    }
  });
} 