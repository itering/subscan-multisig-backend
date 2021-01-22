import { Router } from 'express'
import status from './status'
import wallet from './wallets'

// Init router and path
const router = Router()

// Add sub-routes
router.use('/status', status)
router.use('/calls', wallet)

// Export the base-router
export default router
