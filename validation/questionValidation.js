const Joi = require("joi");

const questionValidation = (data) => {
  const schema = Joi.object({
    questionText: Joi.string().required(),
    options: Joi.array().items(Joi.string()).length(4).required(),
    correctAnswerIndex: Joi.number().integer().min(0).max(3).required(),
    topic: Joi.string().required(),
    createdBy: Joi.string().hex().length(24).required(), // Assuming MongoDB ObjectId
  });

  return schema.validate(data);
};

const quizSubmissionValidation = (data) => {
  const schema = Joi.object({
    answers: Joi.array()
      .items(
        Joi.object({
          questionId: Joi.string().hex().length(24).required(),
          userAnswer: Joi.number().integer().min(0).max(3).required(),
        })
      )
      .min(1)
      .required(),
  });

  return schema.validate(data);
};

const quizResultValidation = (data) => {
  const schema = Joi.object({
    userId: Joi.string().hex().length(24).required(),
    answers: Joi.array()
      .items(
        Joi.object({
          questionId: Joi.string().hex().length(24).required(),
          userAnswer: Joi.number().integer().min(0).max(3).required(),
          correctAnswer: Joi.number().integer().min(0).max(3).required(),
          isCorrect: Joi.boolean().required(),
        })
      )
      .min(1)
      .required(),
    score: Joi.number().integer().min(0).required(),
    totalQuestions: Joi.number().integer().positive().required(),
  });

  return schema.validate(data);
};

module.exports = {
  questionValidation,
  quizSubmissionValidation,
  quizResultValidation,
};
