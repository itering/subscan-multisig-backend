import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => { res.send({'Data':'API is working properly'}) });

export default router;

