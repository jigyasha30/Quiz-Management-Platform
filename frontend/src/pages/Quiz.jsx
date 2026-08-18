import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaFlag,
  FaGraduationCap,
  FaTimesCircle,
} from "react-icons/fa";

import API from "../services/api";
import "./Quiz.css";

function Quiz() {
  const navigate = useNavigate();

  // =========================================================
  // LOAD SELECTED QUIZ
  // =========================================================

  const savedQuiz = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("selectedQuiz") || "null"
      );
    } catch (error) {
      console.error("Selected quiz parse error:", error);
      return null;
    }
  }, []);

  // =========================================================
  // QUIZ ID
  // =========================================================

  const quizId =
    savedQuiz?._id ||
    savedQuiz?.id ||
    savedQuiz?.quizId;

  // =========================================================
  // STATE
  // =========================================================

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [attempt, setAttempt] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("currentAttempt") || "null"
      );
    } catch (error) {
      console.error("Current attempt parse error:", error);
      return null;
    }
  });

  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const savedIndex = Number(
      localStorage.getItem("currentQuestionIndex") || 0
    );

    return Number.isInteger(savedIndex) && savedIndex >= 0
      ? savedIndex
      : 0;
  });

  const [answers, setAnswers] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("quizAnswers") || "{}"
      );
    } catch (error) {
      console.error("Answers parse error:", error);
      return {};
    }
  });

  const [timeLeft, setTimeLeft] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isStartingAttempt, setIsStartingAttempt] =
    useState(false);

  // =========================================================
  // START ATTEMPT
  // =========================================================

  const createAttempt = async (selectedQuizId) => {
    try {
      setIsStartingAttempt(true);
      setError("");

      console.log(
        "===================================="
      );

      console.log(
        "STARTING QUIZ ATTEMPT"
      );

      console.log(
        "Quiz ID:",
        selectedQuizId
      );

      console.log(
        "===================================="
      );

      const response = await API.post(
        `/attempts/start/${selectedQuizId}`
      );

      console.log(
        "Start Attempt Response:",
        response.data
      );

      const newAttempt =
        response?.data?.attempt;

      if (!newAttempt?._id) {
        throw new Error(
          "Attempt ID was not returned by the server."
        );
      }

      setAttempt(newAttempt);

      localStorage.setItem(
        "currentAttempt",
        JSON.stringify(newAttempt)
      );

      console.log(
        "✅ Attempt created:",
        newAttempt._id
      );

      return newAttempt;
    } catch (attemptError) {
      console.error(
        "Start Attempt Error:",
        attemptError
      );

      console.error(
        "Start Attempt Response:",
        attemptError?.response?.data
      );

      throw attemptError;
    } finally {
      setIsStartingAttempt(false);
    }
  };

  // =========================================================
  // FETCH QUIZ
  // =========================================================

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) {
        setError(
          "Quiz ID not found. Please start the quiz again."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log(
          "===================================="
        );

        console.log(
          "FETCHING QUIZ"
        );

        console.log(
          "Quiz ID:",
          quizId
        );

        console.log(
          "===================================="
        );

        const response = await API.get(
          `/quizzes/${quizId}`
        );

        console.log(
          "Quiz API Response:",
          response.data
        );

        const fetchedQuiz =
          response?.data?.quiz;

        if (!fetchedQuiz) {
          throw new Error(
            "Quiz data not found."
          );
        }

        // =====================================================
        // QUESTIONS
        // =====================================================

        const fetchedQuestions =
          Array.isArray(
            fetchedQuiz.questions
          )
            ? fetchedQuiz.questions
            : [];

        console.log(
          "Questions received:",
          fetchedQuestions
        );

        if (
          fetchedQuestions.length === 0
        ) {
          setQuestions([]);

          setError(
            "This quiz does not contain any questions."
          );

          setLoading(false);

          return;
        }

        setQuiz(fetchedQuiz);

        setQuestions(
          fetchedQuestions
        );

        // =====================================================
        // CHECK CURRENT ATTEMPT
        // =====================================================

        let existingAttempt = attempt;

        const savedAttemptRaw =
          localStorage.getItem(
            "currentAttempt"
          );

        if (savedAttemptRaw) {
          try {
            existingAttempt =
              JSON.parse(
                savedAttemptRaw
              );
          } catch (parseError) {
            console.error(
              "Saved attempt parse error:",
              parseError
            );

            existingAttempt = null;
          }
        }

        const existingAttemptId =
          existingAttempt?._id ||
          existingAttempt?.id;

        // =====================================================
        // IF NO ATTEMPT EXISTS, CREATE ONE
        // =====================================================

        if (!existingAttemptId) {
          console.log(
            "No current attempt found."
          );

          console.log(
            "Creating a new attempt..."
          );

          existingAttempt =
            await createAttempt(
              quizId
            );
        } else {
          console.log(
            "Existing attempt found:",
            existingAttemptId
          );

          setAttempt(
            existingAttempt
          );
        }

        // =====================================================
        // TIMER
        // =====================================================

        const duration =
          Number(
            fetchedQuiz.duration
          ) || 20;

        const savedTime = Number(
          localStorage.getItem(
            "questionTimeLeft"
          )
        );

        if (
          Number.isFinite(savedTime) &&
          savedTime > 0
        ) {
          setTimeLeft(
            savedTime
          );
        } else {
          setTimeLeft(
            duration * 60
          );
        }

        // =====================================================
        // CURRENT QUESTION
        // =====================================================

        const savedIndex = Number(
          localStorage.getItem(
            "currentQuestionIndex"
          ) || 0
        );

        if (
          savedIndex >= 0 &&
          savedIndex <
            fetchedQuestions.length
        ) {
          setCurrentQuestion(
            savedIndex
          );
        } else {
          setCurrentQuestion(0);

          localStorage.setItem(
            "currentQuestionIndex",
            "0"
          );
        }

      } catch (fetchError) {
        console.error(
          "Fetch Quiz Error:",
          fetchError
        );

        console.error(
          "Response:",
          fetchError?.response?.data
        );

        const message =
          fetchError?.response?.data
            ?.message ||
          fetchError?.message ||
          "Unable to load quiz.";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // =========================================================
  // SAVE CURRENT QUESTION
  // =========================================================

  useEffect(() => {
    localStorage.setItem(
      "currentQuestionIndex",
      String(currentQuestion)
    );
  }, [currentQuestion]);

  // =========================================================
  // SAVE ANSWERS
  // =========================================================

  useEffect(() => {
    localStorage.setItem(
      "quizAnswers",
      JSON.stringify(answers)
    );
  }, [answers]);

  // =========================================================
  // SAVE TIMER
  // =========================================================

  useEffect(() => {
    if (timeLeft > 0) {
      localStorage.setItem(
        "questionTimeLeft",
        String(timeLeft)
      );
    }
  }, [timeLeft]);

  // =========================================================
  // TIMER
  // =========================================================

  useEffect(() => {
    if (
      loading ||
      questions.length === 0 ||
      isSubmitting ||
      isStartingAttempt
    ) {
      return;
    }

    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);

          localStorage.setItem(
            "questionTimeLeft",
            "0"
          );

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [
    loading,
    questions.length,
    timeLeft,
    isSubmitting,
    isStartingAttempt,
  ]);

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(
      0,
      Number(seconds) || 0
    );

    const minutes = Math.floor(
      safeSeconds / 60
    );

    const secondsRemaining =
      safeSeconds % 60;

    return `${String(
      minutes
    ).padStart(2, "0")}:${String(
      secondsRemaining
    ).padStart(2, "0")}`;
  };

  // =========================================================
  // CURRENT QUESTION
  // =========================================================

  const question =
    questions[currentQuestion];

  // =========================================================
  // QUESTION TEXT
  // =========================================================

  const questionText =
    question?.questionText ||
    question?.question ||
    question?.text ||
    "Question";

  // =========================================================
  // OPTIONS
  // =========================================================

  const options = Array.isArray(
    question?.options
  )
    ? question.options
    : [];

  // =========================================================
  // CURRENT ANSWER
  // =========================================================

  const selectedAnswer =
    answers[currentQuestion] ?? "";

  // =========================================================
  // SELECT ANSWER
  // =========================================================

  const handleAnswer = (answer) => {
    if (
      isSubmitting ||
      isStartingAttempt
    ) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]: answer,
    }));
  };

  // =========================================================
  // NEXT
  // =========================================================

  const handleNext = () => {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) =>
          previous + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // =========================================================
  // PREVIOUS
  // =========================================================

  const handlePrevious = () => {
    if (
      currentQuestion > 0
    ) {
      setCurrentQuestion(
        (previous) =>
          previous - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  async function handleSubmit(
    autoSubmit = false
  ) {
    if (
      isSubmitting ||
      isStartingAttempt
    ) {
      return;
    }

    // =======================================================
    // GET ATTEMPT ID
    // =======================================================

    let currentAttempt =
      attempt;

    if (!currentAttempt) {
      try {
        const storedAttempt =
          localStorage.getItem(
            "currentAttempt"
          );

        if (storedAttempt) {
          currentAttempt =
            JSON.parse(
              storedAttempt
            );
        }
      } catch (parseError) {
        console.error(
          "Attempt parse error:",
          parseError
        );
      }
    }

    let attemptId =
      currentAttempt?._id ||
      currentAttempt?.id;

    // =======================================================
    // SAFETY: CREATE ATTEMPT IF MISSING
    // =======================================================

    if (!attemptId) {
      if (!quizId) {
        setError(
          "Quiz ID not found. Please start the quiz again."
        );

        return;
      }

      try {
        const newAttempt =
          await createAttempt(
            quizId
          );

        currentAttempt =
          newAttempt;

        attemptId =
          newAttempt?._id ||
          newAttempt?.id;
      } catch (attemptError) {
        setError(
          attemptError?.response
            ?.data?.message ||
          attemptError?.message ||
          "Unable to start quiz attempt."
        );

        return;
      }
    }

    if (!attemptId) {
      setError(
        "Quiz attempt could not be created. Please start the quiz again."
      );

      return;
    }

    // =======================================================
    // QUESTIONS SAFETY
    // =======================================================

    if (
      questions.length === 0
    ) {
      setError(
        "No questions available to submit."
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // =====================================================
      // BUILD FINAL ANSWERS
      // =====================================================

      const finalAnswers =
        questions.map(
          (
            questionItem,
            index
          ) => {
            const selected =
              answers[index] ?? "";

            const questionId =
              questionItem?._id;

            console.log(
              `Question ${
                index + 1
              }:`,
              {
                questionId,
                selectedAnswer:
                  selected,
              }
            );

            return {
              questionId,

              selectedAnswer:
                selected
                  ? String(
                      selected
                    ).trim()
                  : "",
            };
          }
        );

      // =====================================================
      // TIME TAKEN
      // =====================================================

      const quizDuration =
        Number(
          quiz?.duration
        ) ||
        Number(
          savedQuiz?.duration
        ) ||
        20;

      const totalQuizSeconds =
        quizDuration * 60;

      const timeTaken = Math.max(
        0,
        totalQuizSeconds -
          timeLeft
      );

      // =====================================================
      // LOG
      // =====================================================

      console.log(
        "===================================="
      );

      console.log(
        "SUBMITTING QUIZ"
      );

      console.log(
        "Attempt ID:",
        attemptId
      );

      console.log(
        "Quiz ID:",
        quizId
      );

      console.log(
        "Question Count:",
        questions.length
      );

      console.log(
        "Answers:",
        finalAnswers
      );

      console.log(
        "Time Taken:",
        timeTaken
      );

      console.log(
        "===================================="
      );

      // =====================================================
      // SUBMIT API
      // =====================================================

      const response =
        await API.post(
          `/attempts/${attemptId}/submit`,
          {
            answers:
              finalAnswers,

            timeTaken,
          }
        );

      console.log(
        "Submit Response:",
        response.data
      );

      if (
        !response?.data?.success
      ) {
        throw new Error(
          response?.data?.message ||
            "Quiz submission failed."
        );
      }

      // =====================================================
      // RESULT
      // =====================================================

      const backendResult =
        response?.data?.result ||
        {};

      const backendAttempt =
        response?.data?.attempt ||
        {};

      const result = {
        ...backendResult,

        attemptId:
          backendResult.attemptId ||
          backendAttempt._id ||
          attemptId,

        score:
          backendResult.score ??
          backendAttempt.score ??
          0,

        totalPoints:
          backendResult.totalPoints ??
          backendAttempt.totalPoints ??
          0,

        percentage:
          backendResult.percentage ??
          backendAttempt.percentage ??
          0,

        correctAnswers:
          backendResult.correctAnswers ??
          backendAttempt.correctAnswers ??
          0,

        wrongAnswers:
          backendResult.wrongAnswers ??
          backendAttempt.wrongAnswers ??
          0,

        unanswered:
          backendResult.unanswered ??
          backendAttempt.unanswered ??
          0,

        timeTaken:
          backendResult.timeTaken ??
          backendAttempt.timeTaken ??
          timeTaken,

        quizId,

        quizTitle:
          quiz?.title ||
          savedQuiz?.title ||
          "Quiz",

        autoSubmitted:
          autoSubmit,
      };

      console.log(
        "Final Result:",
        result
      );

      // =====================================================
      // SAVE RESULT
      // =====================================================

      localStorage.setItem(
        "quizResult",
        JSON.stringify(result)
      );

      // =====================================================
      // CLEAR QUIZ PROGRESS
      // =====================================================

      localStorage.removeItem(
        "currentQuestionIndex"
      );

      localStorage.removeItem(
        "questionTimeLeft"
      );

      localStorage.removeItem(
        "quizAnswers"
      );

      localStorage.removeItem(
        "currentAttempt"
      );

      // =====================================================
      // NAVIGATE RESULT
      // =====================================================

      navigate(
        "/result",
        {
          replace: true,
        }
      );

    } catch (submitError) {
      console.error(
        "Submit Quiz Error:",
        submitError
      );

      console.error(
        "Submit Response:",
        submitError?.response?.data
      );

      setError(
        submitError?.response?.data
          ?.message ||
        submitError?.response?.data
          ?.error ||
        submitError?.message ||
        "Unable to submit quiz."
      );

      setIsSubmitting(false);
    }
  }

  // =========================================================
  // AUTO SUBMIT WHEN TIMER ENDS
  // =========================================================

  useEffect(() => {
    if (
      loading ||
      questions.length === 0 ||
      isSubmitting ||
      isStartingAttempt
    ) {
      return;
    }

    if (
      timeLeft === 0 &&
      attempt
    ) {
      handleSubmit(true);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    timeLeft,
    loading,
    questions.length,
    isSubmitting,
    isStartingAttempt,
    attempt,
  ]);

  // =========================================================
  // EXIT
  // =========================================================

  const handleExit = () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to leave this quiz? Your current progress may be lost."
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "selectedQuiz"
    );

    localStorage.removeItem(
      "currentAttempt"
    );

    localStorage.removeItem(
      "currentQuestionIndex"
    );

    localStorage.removeItem(
      "questionTimeLeft"
    );

    localStorage.removeItem(
      "quizAnswers"
    );

    navigate("/quizzes");
  };

  // =========================================================
  // ANSWERED COUNT
  // =========================================================

  const answeredCount =
    Object.values(
      answers
    ).filter(
      (answer) =>
        answer !== null &&
        answer !== undefined &&
        String(answer).trim() !== ""
    ).length;

  // =========================================================
  // PROGRESS
  // =========================================================

  const progress =
    questions.length > 0
      ? ((currentQuestion + 1) /
          questions.length) *
        100
      : 0;

  const isLastQuestion =
    currentQuestion ===
    questions.length - 1;

  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading ||
    isStartingAttempt
  ) {
    return (
      <div className="quiz-page">
        <div className="quiz-error-page">
          <FaClock />

          <h2>
            {isStartingAttempt
              ? "Starting Quiz..."
              : "Loading Quiz..."}
          </h2>

          <p>
            {isStartingAttempt
              ? "Preparing your quiz attempt..."
              : "Please wait while we load the questions."}
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // NO QUESTIONS
  // =========================================================

  if (
    !quiz ||
    questions.length === 0
  ) {
    return (
      <div className="quiz-page">
        <div className="quiz-error-page">
          <FaTimesCircle />

          <h2>
            No questions found
          </h2>

          <p>
            {error ||
              "This quiz does not contain any questions."}
          </p>

          <Link
            to="/quizzes"
            className="quiz-back-button"
          >
            Browse Quizzes
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="quiz-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="quiz-header">

        <div className="quiz-header-inner">

          <Link
            to="/dashboard"
            className="quiz-logo"
          >
            <div className="quiz-logo-icon">
              <FaGraduationCap />
            </div>

            <span>
              Quiz
              <span>
                Master
              </span>
            </span>
          </Link>

          <div className="quiz-header-title">

            <span>
              {quiz.category}
            </span>

            <h1>
              {quiz.title}
            </h1>

          </div>

          <button
            type="button"
            className="quiz-exit-button"
            onClick={handleExit}
            disabled={
              isSubmitting ||
              isStartingAttempt
            }
          >
            Exit Quiz
          </button>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="quiz-container">

        {/* ERROR */}

        {error && (
          <div className="quiz-error">
            <FaTimesCircle />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* ===================================================
            TOP SECTION
        =================================================== */}

        <section className="quiz-top-section">

          <div className="quiz-top-content">

            <div>

              <span className="quiz-eyebrow">
                {quiz.category}
              </span>

              <h2>
                {quiz.title}
              </h2>

              <p>
                Select the correct answer
                and move to the next
                question.
              </p>

            </div>

            <div
              className={`quiz-timer ${
                timeLeft <= 60
                  ? "danger"
                  : ""
              }`}
            >
              <FaClock />

              <div>

                <span>
                  TIME LEFT
                </span>

                <strong>
                  {formatTime(
                    timeLeft
                  )}
                </strong>

              </div>

            </div>

          </div>

          {/* PROGRESS */}

          <div className="quiz-progress-wrapper">

            <div className="quiz-progress-info">

              <span>
                Question{" "}
                {currentQuestion + 1}/
                {questions.length}
              </span>

              <span>
                {answeredCount}/
                {questions.length}{" "}
                answered
              </span>

            </div>

            <div className="quiz-progress">

              <div
                className="quiz-progress-bar"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* ===================================================
            QUESTION
        =================================================== */}

        <section className="quiz-question-section">

          <div className="quiz-question-card">

            <div className="quiz-question-header">

              <span className="quiz-question-number">
                Question{" "}
                {currentQuestion + 1}
              </span>

              <span className="quiz-question-count">
                {currentQuestion + 1}/
                {questions.length}
              </span>

            </div>

            <h2 className="quiz-question-title">
              {questionText}
            </h2>

            {/* OPTIONS */}

            <div className="quiz-options">

              {options.map(
                (option, index) => {

                  const optionValue =
                    typeof option ===
                    "object"
                      ? option.text ||
                        option.value ||
                        option.label ||
                        ""
                      : option;

                  const isSelected =
                    String(
                      selectedAnswer
                    ) ===
                    String(
                      optionValue
                    );

                  const optionLetter =
                    String.fromCharCode(
                      65 + index
                    );

                  return (
                    <button
                      type="button"
                      key={index}
                      className={`quiz-option ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleAnswer(
                          optionValue
                        )
                      }
                      disabled={
                        isSubmitting ||
                        isStartingAttempt
                      }
                    >

                      <span className="quiz-option-letter">
                        {optionLetter}
                      </span>

                      <span className="quiz-option-text">
                        {optionValue}
                      </span>

                      {isSelected && (
                        <FaCheckCircle className="quiz-option-check" />
                      )}

                    </button>
                  );
                }
              )}

            </div>

            {/* SELECTED MESSAGE */}

            {selectedAnswer && (
              <div className="quiz-selected-message">

                <FaCheckCircle />

                <span>
                  Answer selected
                </span>

              </div>
            )}

          </div>

        </section>

        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <section className="quiz-navigation">

          <button
            type="button"
            className="quiz-nav-button secondary"
            onClick={
              handlePrevious
            }
            disabled={
              currentQuestion ===
                0 ||
              isSubmitting ||
              isStartingAttempt
            }
          >
            <FaArrowLeft />

            Previous
          </button>

          <div className="quiz-navigation-center">

            <span>
              {answeredCount} of{" "}
              {questions.length}{" "}
              answered
            </span>

          </div>

          {!isLastQuestion ? (
            <button
              type="button"
              className="quiz-nav-button primary"
              onClick={
                handleNext
              }
              disabled={
                isSubmitting ||
                isStartingAttempt
              }
            >
              Next

              <FaArrowRight />
            </button>
          ) : (
            <button
              type="button"
              className="quiz-nav-button submit"
              onClick={() =>
                handleSubmit(false)
              }
              disabled={
                isSubmitting ||
                isStartingAttempt
              }
            >
              {isSubmitting
                ? "Submitting..."
                : "Submit Quiz"}

              {!isSubmitting && (
                <FaFlag />
              )}
            </button>
          )}

        </section>

        {/* ===================================================
            QUESTION NAVIGATOR
        =================================================== */}

        <section className="quiz-question-navigator">

          <div className="quiz-navigator-header">

            <div>

              <span>
                QUESTION NAVIGATOR
              </span>

              <h3>
                Your progress
              </h3>

            </div>

            <span>
              {answeredCount}/
              {questions.length}
            </span>

          </div>

          <div className="quiz-number-grid">

            {questions.map(
              (_, index) => {

                const answered =
                  answers[index] !==
                    undefined &&
                  answers[index] !==
                    null &&
                  String(
                    answers[index]
                  ).trim() !== "";

                const active =
                  index ===
                  currentQuestion;

                return (
                  <button
                    type="button"
                    key={index}
                    className={`quiz-number ${
                      active
                        ? "active"
                        : ""
                    } ${
                      answered
                        ? "answered"
                        : ""
                    }`}
                    onClick={() => {

                      if (
                        isSubmitting ||
                        isStartingAttempt
                      ) {
                        return;
                      }

                      setCurrentQuestion(
                        index
                      );

                      window.scrollTo({
                        top: 0,
                        behavior:
                          "smooth",
                      });

                    }}
                    disabled={
                      isSubmitting ||
                      isStartingAttempt
                    }
                  >
                    {index + 1}

                    {answered && (
                      <FaCheckCircle />
                    )}

                  </button>
                );
              }
            )}

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="quiz-footer">

        <Link
          to="/dashboard"
          className="quiz-footer-logo"
        >
          <FaGraduationCap />

          QuizMaster
        </Link>

        <span>
          Learn. Attempt. Improve.
        </span>

        <span>
          © 2026 QuizMaster
        </span>

      </footer>

    </div>
  );
}

export default Quiz;