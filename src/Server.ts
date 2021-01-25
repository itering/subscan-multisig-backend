import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'

import Ddos from 'ddos'

import express, { Request, Response, NextFunction } from 'express'
import { BAD_REQUEST } from 'http-status-codes'
import 'express-async-errors'

import BaseRouter from './routes'
import logger from './shared/Logger'

// Init express
const app = express()
const ddos = new Ddos({
  burst: 5,
  limit: 10,
  errormessage: 'ERROR 429 Too Many Requests',
})

/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors())
app.use(ddos.express)
// app.use((req, res, next) => setTimeout(next, 10000))

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Security
if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
}

// Add APIs
app.use('/', BaseRouter)

// Print API errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, err)
  return res.status(BAD_REQUEST).json({
    error: err.message,
  })
})

export default app
