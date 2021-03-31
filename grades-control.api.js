import express from 'express';
import { promises as fs } from 'fs';
import gradesRouter from './routes/grades.js';
import winston from 'winston';

global.fileName = './created/grades.json';

const { readFile, writeFile } = fs;
const app = express();
const { combine, timestamp, label, printf } = winston.format;
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});
global.logger = winston.createLogger({
  level: 'silly',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'grades-control.api.log' }),
  ],
  format: combine(
    label({ label: 'grades-control.api' }),
    timestamp(),
    myFormat
  ),
});

app.use(express.json());
app.use('/grades', gradesRouter);

app.listen(3000, async () => {
  try {
    await readFile(global.fileName);
    logger.info('API Started');
  } catch (err) {
    const grades = JSON.parse(await readFile('./data/grades.json'));

    try {
      await writeFile(global.fileName, JSON.stringify(grades));
      logger.info('API Started and File created');
    } catch (err) {
      logger.error(err);
    }
  }
});
