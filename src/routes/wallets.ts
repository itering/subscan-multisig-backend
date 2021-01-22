import express, { Request, Response, NextFunction } from 'express'
import { storage } from '../index'
import _ from 'lodash'

const router = express.Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const { multisig_address, chain } = req.query
  const query = {
    $and: [
      { 'multisig_address': multisig_address },
      { 'chain': chain },
    ],
  }
  const records = await storage.find(query)

  res.send(records)
})

export default router
