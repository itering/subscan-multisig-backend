import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    const { address, signature } = req.query;
    res.send({ 'Address': address , 'Signature': signature})
});

export default router;

