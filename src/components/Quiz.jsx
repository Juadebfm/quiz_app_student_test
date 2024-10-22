import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { GiLaserWarning } from "react-icons/gi";
import { Link } from "react-router-dom";

const Quiz = () => {
  const [step, setStep] = useState(() => {
    // Check if quiz has been completed before
    const hasCompletedQuiz = localStorage.getItem("quizCompleted") === "true";
    const savedStep = localStorage.getItem("quizStep");

    // Only return "completed" if the quiz was completed in a previous session
    if (hasCompletedQuiz && !savedStep) {
      return "completed";
    }
    // Otherwise, return the saved step or default to "info"
    return savedStep || "info";
  });

  const [questions, setQuestions] = useState(() => {
    const savedQuestions = localStorage.getItem("quizQuestions");
    return savedQuestions ? JSON.parse(savedQuestions) : [];
  });
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    return parseInt(localStorage.getItem("currentQuestion")) || 0;
  });
  const [userAnswers, setUserAnswers] = useState(() => {
    const savedAnswers = localStorage.getItem("userAnswers");
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = localStorage.getItem("timeLeft");
    if (savedTime) {
      const elapsed =
        (Date.now() -
          parseInt(localStorage.getItem("lastTimestamp") || Date.now())) /
        1000;
      const remaining = Math.max(0, parseInt(savedTime) - Math.floor(elapsed));
      return remaining;
    }
    return 20 * 60;
  });
  const [quizSubmitted, setQuizSubmitted] = useState(() => {
    return localStorage.getItem("quizSubmitted") === "true";
  });
  const [score, setScore] = useState(() => {
    // Modified score initialization to handle the results view properly
    const savedScore = localStorage.getItem("quizScore");
    const quizSubmitted = localStorage.getItem("quizSubmitted") === "true";
    const isShowingResults = localStorage.getItem("quizStep") === "results";

    // Only return the score if we're showing results or the quiz was submitted
    return (quizSubmitted || isShowingResults) && savedScore
      ? JSON.parse(savedScore)
      : null;
  });
  const [isShivering, setIsShivering] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (step !== "completed") {
      localStorage.setItem("quizStep", step);
      localStorage.setItem("quizQuestions", JSON.stringify(questions));
      localStorage.setItem("currentQuestion", currentQuestion.toString());
      localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
      localStorage.setItem("timeLeft", timeLeft.toString());
      localStorage.setItem("lastTimestamp", Date.now().toString());
      localStorage.setItem("quizSubmitted", quizSubmitted.toString());
      if (score) localStorage.setItem("quizScore", JSON.stringify(score));
    }
  }, [
    step,
    questions,
    currentQuestion,
    userAnswers,
    timeLeft,
    quizSubmitted,
    score,
  ]);

  // Check if quiz was already completed
  useEffect(() => {
    const hasCompletedQuiz = localStorage.getItem("quizCompleted") === "true";
    if (hasCompletedQuiz && step !== "completed") {
      setStep("completed");
      // Load the last score if available
      const savedScore = localStorage.getItem("quizScore");
      if (savedScore) {
        setScore(JSON.parse(savedScore));
      }
    }
  }, []);

  useEffect(() => {
    if (questions.length === 0 && step === "quiz") {
      fetchQuestions();
    }
  }, [step]);

  useEffect(() => {
    if (step === "quiz" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            submitQuiz();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  // Add beforeunload event listener to warn users before leaving/refreshing
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (step === "quiz" && !quizSubmitted) {
        e.preventDefault();
        e.returnValue =
          "You have an unfinished quiz. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step, quizSubmitted]);

  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  const fetchQuestions = async () => {
    // Only fetch if we don't have questions stored
    if (questions.length > 0) return;

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(
        "https://quiz-app-student-test.vercel.app/api/quiz/random?count=5",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to fetch questions. Please try again later.");
    }
  };

  const handleConsent = () => {
    setStep("quiz");
  };

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setUserAnswers({
      ...userAnswers,
      [questions[currentQuestion]._id]: answerIndex,
    });
    setIsShivering(true);

    setTimeout(() => {
      setIsShivering(false);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      }
    }, 500);
  };

  const submitQuiz = async () => {
    const answers = Object.entries(userAnswers).map(
      ([questionId, userAnswer]) => ({
        questionId,
        userAnswer,
      })
    );

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(
        "https://quiz-app-student-test.vercel.app/api/quiz/submit",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answers }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Update state and localStorage atomically
      setScore(result);
      setQuizSubmitted(true);
      setStep("results");

      localStorage.setItem("quizSubmitted", "true");
      localStorage.setItem("quizScore", JSON.stringify(result));
      localStorage.setItem("quizStep", "results");

      // Only mark as completed after showing results
      localStorage.setItem("quizCompleted", "true");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz. Please try again.");
    }
  };

  // Modified clearQuizData to handle step transition correctly
  const clearQuizData = () => {
    const hasCompletedQuiz = localStorage.getItem("quizCompleted") === "true";

    localStorage.removeItem("quizQuestions");
    localStorage.removeItem("currentQuestion");
    localStorage.removeItem("userAnswers");
    localStorage.removeItem("timeLeft");
    localStorage.removeItem("quizSubmitted");
    localStorage.removeItem("quizStep");

    setQuestions([]);
    setCurrentQuestion(0);
    setUserAnswers({});
    setTimeLeft(20 * 60);
    setQuizSubmitted(false);

    // Only switch to completed state after showing results
    // and only if this wasn't the first attempt
    if (step === "results" && hasCompletedQuiz) {
      setStep("completed");
    }
  };

  // Modified the completed check useEffect
  useEffect(() => {
    const hasCompletedQuiz = localStorage.getItem("quizCompleted") === "true";
    const savedStep = localStorage.getItem("quizStep");

    // Only switch to completed if there's no active quiz session
    if (hasCompletedQuiz && !savedStep && step !== "results") {
      setStep("completed");
      // Load the last score if available
      const savedScore = localStorage.getItem("quizScore");
      if (savedScore) {
        setScore(JSON.parse(savedScore));
      }
    }
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const renderStep = () => {
    switch (step) {
      case "info":
        return (
          <div className="bg-white shadow-md rounded flex items-center justify-center flex-col h-screen">
            <img
              src="/logo.png"
              alt=""
              className="w-[70px] h-[70px] mb-4 animate-pulse duration-200"
            />
            <h2 className="text-5xl mb-4 font-bold">Quiz Information</h2>
            <p className="text-2xl mb-10">
              Welcome to the quiz! Here's some important information:
            </p>
            <ul className="list-disc text-xl space-y-4 pl-5 mb-10 text-red-500 font-bold">
              <li>This is a one-time quiz - you can only take it once.</li>
              <li>The quiz consists of multiple-choice questions.</li>
              <li>You have 20 minutes to complete the quiz.</li>
              <li>Your progress will be saved if you refresh the page.</li>
              <li>Please read each question carefully before answering.</li>
              <li>
                Activities on the quiz page is monitored. Including keystokes,
                camera and switching tabs.
              </li>
            </ul>
            <button
              onClick={handleConsent}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              I understand and want to start the quiz
            </button>
          </div>
        );
      case "completed":
        return (
          <div className="bg-white shadow-md rounded h-screen ">
            <div className="w-[60%] mx-auto flex flex-col items-center justify-center h-full">
              <img
                src="/logo.png"
                alt=""
                className="w-[70px] h-[70px] mb-4 animate-pulse duration-200"
              />
              <h2 className="text-5xl mb-4 font-bold">
                Quiz Already Completed
              </h2>
              <p className="mb-4 text-xl flex items-center flex-col justify-center">
                <span className="font-mono text-2xl font-bold">
                  Your final score was: {score?.score || 0} / {questions.length}
                </span>
              </p>
              <p className="text-gray-600 flex items-center justify-center gap-5 pt-16">
                <span className="">
                  <GiLaserWarning size={50} />
                </span>
                <span>
                  This quiz can only be taken once. <br /> If you need to retake
                  the quiz, please contact your mentor.
                </span>
              </p>
              <Link
                to="/login"
                className="mt-28 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Back To Home
              </Link>
            </div>
          </div>
        );
      case "quiz":
        if (questions.length === 0) return <p>Loading questions...</p>;
        const question = questions[currentQuestion];
        const allQuestionsAnswered =
          Object.keys(userAnswers).length === questions.length;

        return (
          <div className="pt-10 lg:pt-20">
            <div
              className={`bg-white shadow-md rounded overflow-hidden p-5 lg:p-16  ${
                isShivering ? "animate-shiver" : ""
              }`}
            >
              <div className="text-2xl mb-4 flex items-center justify-between">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-3">
                  <img
                    src="/logo.png"
                    alt=""
                    className="w-[50px] h-[50px] mb-4 animate-pulse duration-200"
                  />
                  <div className="mb-4">{formatTime(timeLeft)}</div>
                </div>
                <div className=" hidden lg:block">
                  {currentQuestion + 1} of {questions.length}
                </div>
              </div>

              <p className="font-bold text-xl lg:text-2xl mt-10 mb-5">
                {question.questionText}
              </p>
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full text-black font-normal lg:font-bold p-5 rounded mb-2 text-left 
                  ${
                    selectedAnswer === index
                      ? "bg-blue-500 text-white"
                      : userAnswers[question._id] === index
                      ? "bg-blue-200"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  disabled={isShivering}
                >
                  {String.fromCharCode(97 + index)}. {option}
                </button>
              ))}
              {allQuestionsAnswered && (
                <button
                  onClick={submitQuiz}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        );
      case "results":
        // Modified results view condition
        if (
          !score ||
          !questions.length ||
          !userAnswers ||
          Object.keys(userAnswers).length === 0
        ) {
          return (
            <div className="bg-white shadow-md rounded h-screen">
              <div className="w-[60%] mx-auto flex flex-col items-center justify-center h-full">
                <img
                  src="/logo.png"
                  alt=""
                  className="w-[70px] h-[70px] mb-4 animate-pulse duration-200"
                />
                <h2 className="text-5xl mb-4 font-bold">Invalid Quiz State</h2>
                <p className="text-xl mb-4">Please start a new quiz session.</p>
                <Link
                  to="/login"
                  className="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Back To Home
                </Link>
              </div>
            </div>
          );
        }

        return (
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div>
              <h2 className="text-2xl mb-4">Quiz Results</h2>
              <p className="mb-4">
                Your score: {score?.score || 0} out of {questions.length}
              </p>
            </div>
            {questions.map((question, index) => {
              const userAnswer = userAnswers[question._id];
              if (userAnswer === undefined) return null;

              return (
                <div
                  key={index}
                  className={`mb-4 p-4 rounded ${
                    userAnswer === question.correctAnswerIndex
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  <h3 className="font-bold">Question {index + 1}</h3>
                  <p>{question.questionText}</p>
                  <p>
                    Your answer: {String.fromCharCode(97 + userAnswer)}.{" "}
                    {question.options[userAnswer]}
                  </p>
                  <p>
                    Correct answer:{" "}
                    {String.fromCharCode(97 + question.correctAnswerIndex)}.{" "}
                    {question.options[question.correctAnswerIndex]}
                  </p>
                </div>
              );
            })}
            <Link
              to="/login"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 inline-block"
            >
              Back to Home
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="px-8">{renderStep()}</div>;
};

export default Quiz;
