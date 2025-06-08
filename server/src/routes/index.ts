import { FastifyInstance } from 'fastify'
import { AppContext } from '../types/context.js'
import { createUserRoutes } from './userRoutes.js'
import healthRoutes from './healthRoutes.js'
import sleepRoutes from './sleep.js'

// 모든 라우트 등록
export const createRoutes = (context: AppContext) => async (fastify: FastifyInstance) => {
  // 헬스 체크 라우트
  fastify.register(healthRoutes, { prefix: '/api/health' })

  // 사용자 관련 라우트
  fastify.register(createUserRoutes(context), { prefix: '/api/users' })

  // 수면 기록 관련 라우트
  fastify.register(sleepRoutes, { prefix: '/api' })
}
