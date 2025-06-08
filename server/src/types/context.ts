import { UserService } from '../services/userService.js'
import { Database } from './database.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

export interface AppContext {
  userService: UserService
}
