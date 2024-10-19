import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const savedTime = localStorage.getItem("quizTimeRemaining");
    return savedTime ? parseInt(savedTime, 10) : 15 * 60; // 15 minutes in seconds
  });
  const [quizEnded, setQuizEnded] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("User not authenticated. Please log in.");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (quizStarted) {
      fetchQuestions();
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleWindowBlur);

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("blur", handleWindowBlur);
      };
    }
  }, [quizStarted]);

  useEffect(() => {
    if (timeRemaining > 0 && !quizEnded && quizStarted) {
      const timer = setTimeout(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          localStorage.setItem("quizTimeRemaining", newTime.toString());
          return newTime;
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !quizEnded) {
      endQuiz("Time's up");
    }
  }, [timeRemaining, quizEnded, quizStarted]);

  const handleVisibilityChange = () => {
    if (document.hidden && !quizEnded) {
      terminateQuiz("Tab switched or minimized");
    }
  };

  const handleWindowBlur = () => {
    if (!quizEnded) {
      terminateQuiz("Window lost focus");
    }
  };

  const fetchQuestions = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "https://quiz-snowy-psi.vercel.app/api/questions/random",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        setQuestions(result.data.questions);
      } else {
        toast.error(
          result.message || "Failed to fetch questions. Please try again."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        "An error occurred while fetching questions. Please try again."
      );
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNextQuestion = () => {
    const currentQuestionId = questions[currentQuestionIndex]._id;
    if (selectedAnswers[currentQuestionId] === undefined) {
      toast.warning(
        "Please select an answer before moving to the next question."
      );
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      endQuiz();
    }
  };

  const endQuiz = async (reason = "Quiz completed") => {
    if (quizEnded) return; // Prevent multiple submissions

    setQuizEnded(true);
    const timeTaken = 15 * 60 - timeRemaining;

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.error("Authentication information not found. Please log in again.");
      navigate("/login");
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Content-Type", "application/json");

    const formattedAnswers = questions.map((question) => ({
      question: question._id,
      selectedAnswer:
        selectedAnswers[question._id] !== undefined
          ? selectedAnswers[question._id]
          : -1, // Use -1 for unanswered questions
    }));

    const raw = JSON.stringify({
      user: userId,
      answers: formattedAnswers,
      timeTaken: timeTaken,
      quizType: "random",
      course: "Web Development",
      topic: "HTML",
    });

    console.log("Sending data:", raw);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        "https://quiz-snowy-psi.vercel.app/api/results",
        requestOptions
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }
      const result = await response.json();
      if (result.success) {
        setQuizResults(result.data);
        toast.success("Quiz results submitted successfully!");
      } else {
        toast.error(
          result.message || "Failed to submit quiz results. Please try again."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        `An error occurred while submitting quiz results: ${error.message}`
      );
    }

    // Clear the saved time
    localStorage.removeItem("quizTimeRemaining");
  };

  const terminateQuiz = (reason) => {
    setQuizEnded(true);
    toast.error(`Quiz terminated: ${reason}`);
    // Clear the saved time
    localStorage.removeItem("quizTimeRemaining");
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleStartQuiz = () => {
    setShowInstructions(false);
    setQuizStarted(true);
  };

  if (showInstructions) {
    return (
      <div className="h-screen max-w-2xl mx-auto bg-slate-200 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center shadow-lg rounded-lg px-10 py-14">
          <h1 className="text-3xl font-bold text-center mb-6">
            Quiz Instructions
          </h1>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              You will have{" "}
              <span className="text-red-400 font-bold">15 minutes</span> to
              complete the quiz.
            </li>
            <li>
              There are multiple-choice questions. Select the best answer for
              each.
            </li>
            <li>
              You must answer each question before moving to the next one.
            </li>
            <li>
              Do not <span className="text-red-400 font-bold">switch tabs</span>{" "}
              or{" "}
              <span className="text-red-400 font-bold">
                minimize the window
              </span>{" "}
              during the quiz.
            </li>
            <li>
              If you <span className="text-red-400 font-bold">switch tabs</span>{" "}
              or{" "}
              <span className="text-red-400 font-bold">
                minimize the window
              </span>
              , your quiz will be terminated.
            </li>
            <li>
              Your progress is saved, so you can resume if you accidentally
              close the browser.
            </li>
          </ul>
          <button
            onClick={handleStartQuiz}
            className="w-[80%] py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            I Understand and Agree to Start the Quiz
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center text-xl mt-8 flex items-center justify-center h-screen">
        <div className="flex items-center justify-center">
          <img
            src="/logo.png"
            alt=""
            className="w-[120px] h-[120px] animate-pulse"
          />
        </div>
      </div>
    );
  }

  if (quizEnded) {
    return (
      <div className="h-screen w-[60%] mx-auto bg-slate-200 flex items-center justify-center text-[24px]">
        <div className="w-full flex flex-col items-center justify-center rounded-lg px-10 py-14">
          <img src="/logo.png" alt="" className="w-[70px] h-[70px] mb-5" />

          <h1 className="text-3xl font-bold text-center mb-6">Quiz Results</h1>
          {quizResults ? (
            <div className="space-y-4 w-full flex flex-col items-center justify-center shadow-lg rounded-lg px-10 py-14">
              <p>
                <strong>Quiz Type:</strong> {quizResults.quizType}
              </p>
              <p>
                <strong>Score:</strong> {quizResults.score} /{" "}
                {quizResults.totalQuestions}
              </p>
              <p>
                <strong>Percentage Score:</strong>{" "}
                {Math.round(quizResults.percentageScore)}%
              </p>
              <p>
                <strong>Time Taken:</strong> {formatTime(quizResults.timeTaken)}
              </p>
            </div>
          ) : (
            <p className="text-center text-xl">
              Quiz terminated. Your results were not submitted.
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="h-screen max-w-2xl mx-auto bg-slate-200 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center shadow-lg rounded-lg px-10 py-14">
        <h1 className="text-3xl font-bold text-center mb-6">Quiz</h1>
        <div className="text-xl font-semibold mb-4 text-center">
          Time remaining: {formatTime(timeRemaining)}
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <p className="text-lg mb-4">{currentQuestion.question}</p>
        </div>
        <div className="space-y-3 mb-6">
          {currentQuestion.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(currentQuestion._id, index)}
              className={`w-full p-3 text-left rounded-md transition-colors ${
                selectedAnswers[currentQuestion._id] === index
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {answer}
            </button>
          ))}
        </div>
        <button
          onClick={handleNextQuestion}
          className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          {currentQuestionIndex < questions.length - 1 ? "Next" : "Finish"}
        </button>
      </div>
    </div>
  );
}

export default Quiz;
