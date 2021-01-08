import express, { Request, Response, NextFunction } from 'express';
import Storage from '../storage'
import _ from 'lodash';

const router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const storage = new Storage();
  const { address } = req.query;
  const query = { "item.address": address }; // distinct call hash can is latest = true
  let records = await storage.query(query) as Array<any>;

  res.send(records);
});

export default router;

