import express, { Request, Response, NextFunction } from 'express';
import Storage from '../storage'
import _ from 'lodash';

const router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const storage = new Storage();
    const { address } = req.query;
    let records = await storage.query(address) as Array<any>;

    let groupedByCallHash = _.groupBy(records, function(x) {
        return x.item.eventType;
      });
    res.send(groupedByCallHash);
});

export default router;

