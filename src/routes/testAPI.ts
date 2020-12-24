import express, {Request, Response, NextFunction} from 'express';

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {res.send('API is worksdsing properly')});

export default router;

