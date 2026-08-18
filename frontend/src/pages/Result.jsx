import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaArrowRight,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaFlag,
  FaGraduationCap,
  FaMedal,
  FaRedo,
  FaTimesCircle,
  FaTrophy,
} from "react-icons/fa";

import API from "../services/api";
import "./Result.css";

function Result() {
  const navigate = useNavigate();

  // =========================================================
  // LOAD SAVED RESULT
  // =========================================================

  const savedResult = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("quizResult") || "null"
      );
    } catch (error) {
      console.error("Result parse error:", error);
      return null;
    }
  }, []);

  // =========================================================
  // STATE
  // =========================================================

  const [result, setResult] = useState(savedResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // RESULT ID
  // =========================================================

  const attemptId =
    result?.attemptId ||
    result?._id ||
    result?.id ||
    result?.attempt?._id ||
    result?.attempt?.id;

  // =========================================================
  // FETCH RESULT IF NEEDED
  // =========================================================

  useEffect(() => {
    const fetchResult = async () => {
      if (result || !attemptId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          `/attempts/${attemptId}`
        );

        const fetchedResult =
          response?.data?.result ||
          response?.data?.attempt ||
          response?.data?.data ||
          response?.data;

        if (!fetchedResult) {
          throw new Error("Result data not found.");
        }

        setResult(fetchedResult);

        localStorage.setItem(
          "quizResult",
          JSON.stringify(fetchedResult)
        );
      } catch (fetchError) {
        console.error(
          "Fetch Result Error:",
          fetchError
        );

        setError(
          fetchError?.response?.data?.message ||
            fetchError?.message ||
            "Unable to load quiz result."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, result]);

  // =========================================================
  // NORMALIZE RESULT DATA
  // =========================================================

  const quizTitle =
    result?.quizTitle ||
    result?.quiz?.title ||
    result?.title ||
    "Quiz";

  const category =
    result?.quiz?.category ||
    result?.category ||
    "General";

  const difficulty =
    result?.quiz?.difficulty ||
    result?.difficulty ||
    "Beginner";

  // =========================================================
  // CORRECT ANSWERS
  // =========================================================

  const correctAnswers = Math.max(
    0,
    Number(
      result?.correctAnswers ??
        result?.correct ??
        result?.score ??
        0
    )
  );

  // =========================================================
  // WRONG ANSWERS
  // =========================================================

  const wrongAnswers = Math.max(
    0,
    Number(
      result?.wrongAnswers ??
        result?.incorrectAnswers ??
        result?.wrong ??
        0
    )
  );

  // =========================================================
  // TOTAL QUESTIONS
  // IMPORTANT:
  // FALLBACK TO CORRECT + WRONG
  // =========================================================

  const rawTotalQuestions = Number(
    result?.totalQuestions ??
      result?.total ??
      result?.questionCount ??
      result?.quiz?.questions?.length ??
      0
  );

  const totalQuestions = Math.max(
    0,
    rawTotalQuestions,
    correctAnswers + wrongAnswers
  );

  // =========================================================
  // ANSWERED QUESTIONS
  // =========================================================

  const answeredQuestions = Math.min(
    totalQuestions,
    Math.max(
      0,
      Number(
        result?.answeredQuestions ??
          result?.answered ??
          correctAnswers + wrongAnswers
      )
    )
  );

  // =========================================================
  // UNANSWERED QUESTIONS
  // =========================================================

  const unansweredQuestions = Math.max(
    0,
    totalQuestions - answeredQuestions
  );

  // =========================================================
  // PERCENTAGE
  // =========================================================

  const percentage = Math.max(
    0,
    Math.min(
      100,
      Number(
        result?.percentage ??
          result?.scorePercentage ??
          (totalQuestions > 0
            ? (correctAnswers /
                totalQuestions) *
              100
            : 0)
      )
    )
  );

  const roundedPercentage =
    Math.round(percentage);

  // =========================================================
  // PASS STATUS
  // =========================================================

  const passingPercentage = Number(
    result?.passingPercentage ??
      result?.passPercentage ??
      60
  );

  const passed =
    typeof result?.passed === "boolean"
      ? result.passed
      : percentage >= passingPercentage;

  // =========================================================
  // TIME
  // =========================================================

  const timeTaken = Math.max(
    0,
    Number(
      result?.timeTaken ??
        result?.timeSpent ??
        0
    )
  );

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(
      0,
      Math.floor(Number(seconds) || 0)
    );

    const hours = Math.floor(
      safeSeconds / 3600
    );

    const minutes = Math.floor(
      (safeSeconds % 3600) / 60
    );

    const remainingSeconds =
      safeSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${String(
        minutes
      ).padStart(2, "0")}m`;
    }

    return `${minutes}m ${String(
      remainingSeconds
    ).padStart(2, "0")}s`;
  };

  // =========================================================
  // DATE
  // =========================================================

  const submittedAt =
    result?.submittedAt ||
    result?.completedAt ||
    result?.createdAt;

  const formattedDate = submittedAt
    ? new Date(
        submittedAt
      ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // =========================================================
  // RESULT MESSAGE
  // =========================================================

  const resultMessage = passed
    ? roundedPercentage >= 80
      ? "Excellent performance!"
      : "Great job! You passed the quiz."
    : "Keep practicing and try again!";

  const resultSubMessage = passed
    ? "Your preparation is showing. Keep improving your score."
    : "Review the questions and strengthen your concepts before your next attempt.";

  // =========================================================
  // RETRY QUIZ
  // =========================================================

  const handleRetry = async () => {
    const quizId =
      result?.quizId ||
      result?.quiz?._id ||
      result?.quiz?.id;

    if (!quizId) {
      navigate("/quizzes");
      return;
    }

    try {
      setError("");

      localStorage.removeItem("quizResult");
      localStorage.removeItem(
        "currentQuestionIndex"
      );
      localStorage.removeItem(
        "questionTimeLeft"
      );
      localStorage.removeItem("quizAnswers");
      localStorage.removeItem("currentAttempt");

      const response = await API.post(
        `/attempts/start/${quizId}`
      );

      const attempt =
        response?.data?.attempt ||
        response?.data?.data;

      if (!attempt?._id) {
        throw new Error(
          "Unable to start quiz."
        );
      }

      const selectedQuiz = {
        id: quizId,
        _id: quizId,

        title:
          result?.quiz?.title ||
          result?.quizTitle ||
          "Quiz",

        category,

        difficulty,

        duration:
          Number(
            result?.quiz?.duration
          ) || 20,
      };

      localStorage.setItem(
        "selectedQuiz",
        JSON.stringify(selectedQuiz)
      );

      localStorage.setItem(
        "currentAttempt",
        JSON.stringify(attempt)
      );

      localStorage.setItem(
        "currentQuestionIndex",
        "0"
      );

      localStorage.setItem(
        "quizAnswers",
        JSON.stringify({})
      );

      navigate("/quiz");
    } catch (retryError) {
      console.error(
        "Retry Quiz Error:",
        retryError
      );

      setError(
        retryError?.response?.data?.message ||
          retryError?.message ||
          "Unable to restart quiz."
      );
    }
  };

  // =========================================================
  // GO TO QUIZZES
  // =========================================================

  const handleBrowseQuizzes = () => {
    localStorage.removeItem("quizResult");

    navigate("/quizzes");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="result-page">
        <div className="result-loading">
          <div className="result-spinner"></div>

          <h2>
            Loading your result...
          </h2>

          <p>
            Please wait while we prepare
            your performance summary.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // NO RESULT
  // =========================================================

  if (!result) {
    return (
      <div className="result-page">
        <div className="result-error-page">
          <FaTimesCircle />

          <h2>
            Result not found
          </h2>

          <p>
            Your quiz result could not be
            found. Please attempt a quiz
            first.
          </p>

          <div className="result-error-actions">
            <Link
              to="/quizzes"
              className="result-primary-button"
            >
              Browse Quizzes
              <FaArrowRight />
            </Link>

            <Link
              to="/dashboard"
              className="result-secondary-button"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="result-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="result-header">
        <div className="result-header-inner">

          <Link
            to="/dashboard"
            className="result-logo"
          >
            <div className="result-logo-icon">
              <FaGraduationCap />
            </div>

            <span>
              Quiz
              <span>
                Master
              </span>
            </span>
          </Link>

          <div className="result-header-title">

            <span>
              QUIZ RESULT
            </span>

            <h1>
              {quizTitle}
            </h1>

          </div>

          <Link
            to="/dashboard"
            className="result-header-button"
          >
            Dashboard
          </Link>

        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="result-container">

        {/* ERROR */}

        {error && (
          <div className="result-error">
            <FaTimesCircle />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* ===================================================
            RESULT HERO
        =================================================== */}

        <section
          className={`result-hero ${
            passed
              ? "result-passed"
              : "result-failed"
          }`}
        >

          <div className="result-hero-content">

            <span className="result-eyebrow">
              {passed
                ? "QUIZ COMPLETED"
                : "KEEP LEARNING"}
            </span>

            <h2>
              {resultMessage}
            </h2>

            <p>
              {resultSubMessage}
            </p>

            <div className="result-quiz-info">

              <span>
                {category}
              </span>

              <span>
                {difficulty}
              </span>

              {formattedDate && (
                <span>
                  {formattedDate}
                </span>
              )}

            </div>

          </div>

          <div className="result-status-icon">

            {passed ? (
              <FaTrophy />
            ) : (
              <FaGraduationCap />
            )}

          </div>

        </section>

        {/* ===================================================
            SCORE SECTION
        =================================================== */}

        <section className="result-score-section">

          <div className="result-score-card">

            <div
              className={`result-score-circle ${
                passed
                  ? "passed"
                  : "failed"
              }`}
              style={{
                "--score":
                  roundedPercentage,
              }}
            >

              <div>

                <strong>
                  {roundedPercentage}%
                </strong>

                <span>
                  Your Score
                </span>

              </div>

            </div>

            <div className="result-score-content">

              <span className="result-score-label">
                FINAL RESULT
              </span>

              <h3>
                {passed
                  ? "Passed"
                  : "Not Passed"}
              </h3>

              <p>
                You scored{" "}
                <strong>
                  {correctAnswers}
                </strong>{" "}
                out of{" "}
                <strong>
                  {totalQuestions}
                </strong>{" "}
                questions correctly.
              </p>

              <div
                className={`result-status-badge ${
                  passed
                    ? "passed"
                    : "failed"
                }`}
              >

                {passed ? (
                  <FaCheckCircle />
                ) : (
                  <FaTimesCircle />
                )}

                {passed
                  ? "PASS"
                  : "NEEDS PRACTICE"}

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            STATS
        =================================================== */}

        <section className="result-stats">

          <div className="result-stat-card">

            <div className="result-stat-icon correct">
              <FaCheckCircle />
            </div>

            <div>

              <span>
                CORRECT
              </span>

              <strong>
                {correctAnswers}
              </strong>

              <small>
                Correct answers
              </small>

            </div>

          </div>

          <div className="result-stat-card">

            <div className="result-stat-icon wrong">
              <FaTimesCircle />
            </div>

            <div>

              <span>
                WRONG
              </span>

              <strong>
                {wrongAnswers}
              </strong>

              <small>
                Incorrect answers
              </small>

            </div>

          </div>

          <div className="result-stat-card">

            <div className="result-stat-icon unanswered">
              <FaFlag />
            </div>

            <div>

              <span>
                UNANSWERED
              </span>

              <strong>
                {unansweredQuestions}
              </strong>

              <small>
                Questions skipped
              </small>

            </div>

          </div>

          <div className="result-stat-card">

            <div className="result-stat-icon time">
              <FaClock />
            </div>

            <div>

              <span>
                TIME TAKEN
              </span>

              <strong>
                {formatTime(timeTaken)}
              </strong>

              <small>
                Quiz duration
              </small>

            </div>

          </div>

        </section>

        {/* ===================================================
            PERFORMANCE SUMMARY
        =================================================== */}

        <section className="result-summary-section">

          <div className="result-section-heading">

            <span>
              PERFORMANCE SUMMARY
            </span>

            <h2>
              Your quiz performance
            </h2>

          </div>

          <div className="result-summary-card">

            {/* CORRECT */}

            <div className="result-summary-row">

              <div className="result-summary-label">

                <FaCheckCircle />

                <span>
                  Correct answers
                </span>

              </div>

              <strong>
                {correctAnswers}
              </strong>

            </div>

            <div className="result-summary-progress">

              <div
                className="result-summary-progress-bar correct"
                style={{
                  width: `${
                    totalQuestions > 0
                      ? Math.min(
                          100,
                          (correctAnswers /
                            totalQuestions) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />

            </div>

            {/* WRONG */}

            <div className="result-summary-row">

              <div className="result-summary-label">

                <FaTimesCircle />

                <span>
                  Wrong answers
                </span>

              </div>

              <strong>
                {wrongAnswers}
              </strong>

            </div>

            <div className="result-summary-progress">

              <div
                className="result-summary-progress-bar wrong"
                style={{
                  width: `${
                    totalQuestions > 0
                      ? Math.min(
                          100,
                          (wrongAnswers /
                            totalQuestions) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />

            </div>

            {/* UNANSWERED */}

            <div className="result-summary-row">

              <div className="result-summary-label">

                <FaFlag />

                <span>
                  Unanswered
                </span>

              </div>

              <strong>
                {unansweredQuestions}
              </strong>

            </div>

            <div className="result-summary-progress">

              <div
                className="result-summary-progress-bar unanswered"
                style={{
                  width: `${
                    totalQuestions > 0
                      ? Math.min(
                          100,
                          (unansweredQuestions /
                            totalQuestions) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* ===================================================
            MOTIVATION CARD
        =================================================== */}

        <section className="result-motivation">

          <div className="result-motivation-icon">
            <FaMedal />
          </div>

          <div>

            <span>
              KEEP IMPROVING
            </span>

            <h2>
              {passed
                ? "You're making great progress!"
                : "Every attempt makes you better!"}
            </h2>

            <p>
              {passed
                ? "Try another quiz and aim for an even higher score."
                : "Review your mistakes, practice more, and give this quiz another try."}
            </p>

          </div>

        </section>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <section className="result-actions">

          <button
            type="button"
            className="result-action-button primary"
            onClick={handleRetry}
          >
            <FaRedo />
            Retry Quiz
          </button>

          <Link
            to="/analytics"
            className="result-action-button analytics"
          >
            <FaChartLine />
            View Analytics
          </Link>

          <button
            type="button"
            className="result-action-button secondary"
            onClick={handleBrowseQuizzes}
          >
            Browse Quizzes
            <FaArrowRight />
          </button>

          <Link
            to="/dashboard"
            className="result-action-button outline"
          >
            <FaArrowLeft />
            Dashboard
          </Link>

        </section>

        {/* ===================================================
            QUICK LINKS
        =================================================== */}

        <section className="result-quick-links">

          <Link to="/dashboard">

            <FaGraduationCap />

            <div>

              <strong>
                Dashboard
              </strong>

              <span>
                View your learning overview
              </span>

            </div>

            <FaArrowRight />

          </Link>

          <Link to="/analytics">

            <FaChartLine />

            <div>

              <strong>
                Performance Analytics
              </strong>

              <span>
                Track your quiz progress
              </span>

            </div>

            <FaArrowRight />

          </Link>

          <Link to="/quizzes">

            <FaTrophy />

            <div>

              <strong>
                More Quizzes
              </strong>

              <span>
                Continue your learning journey
              </span>

            </div>

            <FaArrowRight />

          </Link>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="result-footer">

        <Link
          to="/dashboard"
          className="result-footer-logo"
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

export default Result;