import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

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