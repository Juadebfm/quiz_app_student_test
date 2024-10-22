// ReviewPage.js
import React from "react";
import { useLocation } from "react-router-dom";

const ReviewPage = () => {
  const location = useLocation();
  const { questions, userAnswers, submissionData } = location.state; // Pass these via navigation state

  return (
    <div className="p-8">
      <h2 className="text-2xl mb-4">Review Test</h2>
      {questions.map((question, index) => {
        const userAnswer = userAnswers[index].userAnswer;
        const correctAnswer = question.correctAnswer;

        return (
          <div key={index} className="mb-4">
            <h3 className="text-lg mb-2">{question.questionText}</h3>
            <ul>
              {question.options.map((option, idx) => (
                <li
                  key={idx}
                  className={`${
                    idx === correctAnswer
                      ? "text-green-600"
                      : idx === userAnswer
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewPage;
