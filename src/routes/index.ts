import { Router } from 'express';
import testAPI from './testAPI';

// Init router and path
const router = Router();


// Add sub-routes
router.use('/testAPI', testAPI)

// Export the base-router
export default router;
