import express, { Request, Response, NextFunction } from 'express';
import Storage from '../storage'

const router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const storage = new Storage();
    const { address } = req.query;
    let records = await storage.queryApproveAsMulti_NewMultisig(address);
    res.send(records)
});

export default router;

