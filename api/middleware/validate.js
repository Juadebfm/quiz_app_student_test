import Joi from "joi";

const questionSchema = Joi.object({
  question: Joi.string().required().trim(),
  answers: Joi.array()
    .items(Joi.string().trim().required())
    .length(4)
    .required(),
  correctAnswerIndex: Joi.number().integer().min(0).max(3).required(),
  course: Joi.string().trim().required(),
  topic: Joi.string().trim().required(),
});

const resultSchema = Joi.object({
  user: Joi.string().required().trim(),
  quiz: Joi.string().required().trim(),
  answers: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().required(), // This will be the question's ID
        selectedAnswer: Joi.number().integer().min(0).max(3).required(),
      })
    )
    .required(),
  score: Joi.number().min(0).required(),
  totalQuestions: Joi.number().integer().min(1).required(),
  percentageScore: Joi.number().min(0).max(100).required(),
  timeTaken: Joi.number().min(0).required(),
});

export const validateQuestion = (req, res, next) => {
  const { error } = questionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};

export const validateResult = (req, res, next) => {
  const { error } = resultSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};
