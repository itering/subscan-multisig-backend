import express, { Request, Response, NextFunction } from 'express';
import Storage from '../storage'
import _ from 'lodash';

const router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const storage = new Storage();
  const { multisig_address } = req.query;
  const query = { "item.multisig_address": multisig_address };
  let records = await storage.query(query) as Array<any>;

  res.send(records);
});

export default router;

