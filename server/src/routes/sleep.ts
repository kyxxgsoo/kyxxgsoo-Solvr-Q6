import { FastifyInstance } from 'fastify';
import { sleepRecords } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function sleepRoutes(fastify: FastifyInstance) {
  // 수면 기록 생성
  fastify.post('/sleep', async (request, reply) => {
    const { startTime, endTime, notes } = request.body as {
      startTime: string;
      endTime: string;
      notes?: string;
    };

    const result = await fastify.db.insert(sleepRecords).values({
      startTime,
      endTime,
      notes,
    });

    return reply.code(201).send(result);
  });

  // 수면 기록 목록 조회
  fastify.get('/sleep', async (request, reply) => {
    const records = await fastify.db.select().from(sleepRecords).orderBy(sleepRecords.createdAt);
    return reply.send(records);
  });

  // 수면 기록 수정
  fastify.put('/sleep/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { startTime, endTime, notes } = request.body as {
      startTime: string;
      endTime: string;
      notes?: string;
    };

    const result = await fastify.db
      .update(sleepRecords)
      .set({
        startTime,
        endTime,
        notes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sleepRecords.id, parseInt(id)));

    return reply.send(result);
  });

  // 수면 기록 삭제
  fastify.delete('/sleep/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    await fastify.db
      .delete(sleepRecords)
      .where(eq(sleepRecords.id, parseInt(id)));

    return reply.code(204).send();
  });
} 