import { Router } from 'express'
import healthRoutes from './health.js'
import repositoryRoutes from './repositories.js'
import reviewRoutes from './reviews.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/repositories', repositoryRoutes)
router.use('/reviews', reviewRoutes)

export default router
