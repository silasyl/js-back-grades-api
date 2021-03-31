import express from 'express';
import { promises as fs } from 'fs';

const { readFile, writeFile } = fs;
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    let grade = req.body;

    if (!grade.student || !grade.subject || !grade.type || !grade.value) {
      if (grade.value !== 0) {
        throw new Error('Student, Subject, Type e Value são obrigatórios.');
      }
    }

    const data = JSON.parse(await readFile(global.fileName));

    grade = {
      id: data.nextId++,
      student: grade.student,
      subject: grade.subject,
      type: grade.type,
      value: grade.value,
      timestamp: new Date(),
    };
    data.grades.push(grade);

    await writeFile(global.fileName, JSON.stringify(data));

    res.send(grade);

    logger.info(`POST /grade - ${JSON.stringify(grade)}`);
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const grade = req.body;

    if (
      !grade.id ||
      !grade.student ||
      !grade.subject ||
      !grade.type ||
      !grade.value
    ) {
      if (grade.value !== 0) {
        throw new Error('Id, Name e Balance são obrigatórios.');
      }
    }

    const data = JSON.parse(await readFile(global.fileName));
    const index = data.grades.findIndex((g) => {
      return g.id === grade.id;
    });

    if (index === -1) {
      throw new Error('Registro não encontrado.');
    }

    data.grades[index].student = grade.student;
    data.grades[index].subject = grade.subject;
    data.grades[index].type = grade.type;
    data.grades[index].value = grade.value;

    await writeFile(global.fileName, JSON.stringify(data));

    res.send(grade);
    logger.info(`PUT /grade - ${JSON.stringify(grade)}`);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    data.grades = data.grades.filter((grade) => {
      return grade.id !== parseInt(req.params.id);
    });
    await writeFile(global.fileName, JSON.stringify(data));
    res.end();
    logger.info(`DELETE /grades/:id - ${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    const grade = data.grades.find((grade) => {
      return grade.id === parseInt(req.params.id);
    });
    res.send(grade);
    logger.info('GET /grades/:id');
  } catch (err) {
    next(err);
  }
});

router.get('/calc/totalvalue', async (req, res, next) => {
  try {
    const grade = req.body;

    const data = JSON.parse(await readFile(global.fileName));
    const totalValue = data.grades
      .filter((g) => {
        return g.student === grade.student && g.subject === grade.subject;
      })
      .reduce((acc, cur) => {
        return acc + cur.value;
      }, 0);
    res.send(`Nota total: ${totalValue}`);

    logger.info('GET /grades/calc/totalvalue');
  } catch (err) {
    next(err);
  }
});

router.get('/calc/mean', async (req, res, next) => {
  try {
    const grade = req.body;

    const data = JSON.parse(await readFile(global.fileName));
    let mean = data.grades.filter((g) => {
      return g.subject === grade.subject && g.type === grade.type;
    });

    const numberGrades = mean.reduce((acc, cur) => {
      return (acc += 1);
    }, 0);

    mean =
      mean.reduce((acc, cur) => {
        return acc + cur.value;
      }, 0) / numberGrades;

    res.send(`Média: ${mean}`);

    logger.info('GET /grades/calc/mean');
  } catch (err) {
    next(err);
  }
});

router.get('/calc/top3', async (req, res, next) => {
  try {
    const grade = req.body;

    const data = JSON.parse(await readFile(global.fileName));
    let sortedGrades = data.grades
      .filter((g) => {
        return g.subject === grade.subject && g.type === grade.type;
      })
      .sort((a, b) => {
        return b.value - a.value;
      });

    let top = [];
    try {
      top = [sortedGrades[0], sortedGrades[1], sortedGrades[2]];
    } catch (err) {
      try {
        top = [sortedGrades[0], sortedGrades[1]];
      } catch (err) {
        try {
          top = [sortedGrades[0]];
        } catch (err) {
          next(err);
        }
      }
    }

    res.send(top);

    logger.info('GET /grades/calc/top3');
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.baseUrl} - ${err.message}`);
  res.status(400).send({ error: err.message });
});

export default router;
