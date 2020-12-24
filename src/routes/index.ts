import { Router } from 'express';
import testAPI from './GET/testAPI';
import wallet from './GET/wallets';
import multisigs from './GET/multisigs';

// Init router and path
const router = Router();


// Add sub-routes
router.use('/testAPI', testAPI)
router.use('/wallets', wallet)
router.use('/multisigs', multisigs)

// Export the base-router
export default router;
