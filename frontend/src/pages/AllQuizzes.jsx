import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaGraduationCap,
} from "react-icons/fa";

import API from "../services/api";
import "./AllQuizzes.css";

function AllQuizzes() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD ALL QUIZZES
  // =====================================================

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("quizmasterToken");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await API.get("/quizzes");

        console.log("================================");
        console.log("ALL QUIZZES RESPONSE:");
        console.log(response.data);
        console.log("================================");

        const quizData =
          response.data?.quizzes ||
          response.data?.data ||
          [];

        if (Array.isArray(quizData)) {
          setQuizzes(quizData);
        } else {
          setQuizzes([]);
        }
      } catch (err) {
        console.error("Load All Quizzes Error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("quizmasterToken");
          localStorage.removeItem("quizmasterUser");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load quizzes."
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [navigate]);

  // =====================================================
  // START QUIZ
  // =====================================================

  const handleStartQuiz = async (quiz) => {
    if (!quiz?._id) {
      setError(
        "Unable to start this quiz. Quiz ID is missing."
      );
      return;
    }

    if (startingQuiz) return;

    try {
      setStartingQuiz(true);
      setError("");

      console.log("================================");
      console.log("STARTING QUIZ");
      console.log("Quiz:", quiz);
      console.log("Quiz ID:", quiz._id);
      console.log("================================");

      // ---------------------------------------------------
      // CLEAR OLD QUIZ DATA
      // ---------------------------------------------------

      localStorage.removeItem("quizResult");
      localStorage.removeItem("currentQuestionIndex");
      localStorage.removeItem("questionTimeLeft");
      localStorage.removeItem("quizAnswers");

      // ---------------------------------------------------
      // START ATTEMPT
      // ---------------------------------------------------

      const response = await API.post(
        `/attempts/start/${quiz._id}`
      );

      console.log(
        "START ATTEMPT RESPONSE:",
        response.data
      );

      const attempt =
        response.data?.attempt ||
        response.data?.data;

      if (!attempt?._id) {
        throw new Error(
          "Quiz attempt could not be created."
        );
      }

      console.log("ATTEMPT:", attempt);

      // ---------------------------------------------------
      // GET FULL QUIZ
      // ---------------------------------------------------

      const quizResponse = await API.get(
        `/quizzes/${quiz._id}`
      );

      console.log(
        "FULL QUIZ RESPONSE:",
        quizResponse.data
      );

      const verifiedQuiz =
        quizResponse.data?.quiz ||
        quizResponse.data?.data ||
        quizResponse.data;

      if (!verifiedQuiz?._id) {
        throw new Error(
          "Unable to verify selected quiz."
        );
      }

      // ---------------------------------------------------
      // QUESTION COUNT
      // ---------------------------------------------------

      const questionCount = Array.isArray(
        verifiedQuiz.questions
      )
        ? verifiedQuiz.questions.length
        : Number(verifiedQuiz.questionCount) || 0;

      if (questionCount === 0) {
        throw new Error(
          "This quiz does not contain any questions."
        );
      }

      // ---------------------------------------------------
      // DURATION
      // ---------------------------------------------------

      const duration =
        Number(verifiedQuiz.duration) > 0
          ? Number(verifiedQuiz.duration)
          : 20;

      // ---------------------------------------------------
      // SAVE SELECTED QUIZ
      // ---------------------------------------------------

      const selectedQuiz = {
        id: verifiedQuiz._id,
        _id: verifiedQuiz._id,

        title:
          verifiedQuiz.title ||
          "Quiz",

        description:
          verifiedQuiz.description ||
          "",

        category:
          verifiedQuiz.category ||
          "General",

        difficulty:
          verifiedQuiz.difficulty ||
          "Beginner",

        questions:
          questionCount,

        duration:
          duration,

        totalPoints:
          Number(verifiedQuiz.totalPoints) || 0,
      };

      localStorage.setItem(
        "selectedQuiz",
        JSON.stringify(selectedQuiz)
      );

      // ---------------------------------------------------
      // SAVE CURRENT ATTEMPT
      // ---------------------------------------------------

      localStorage.setItem(
        "currentAttempt",
        JSON.stringify(attempt)
      );

      // ---------------------------------------------------
      // RESET QUIZ STATE
      // ---------------------------------------------------

      localStorage.setItem(
        "currentQuestionIndex",
        "0"
      );

      localStorage.setItem(
        "quizAnswers",
        JSON.stringify({})
      );

      // Important:
      // Remove old timer value completely.
      // Quiz.jsx will create the timer from quiz duration.
      localStorage.removeItem(
        "questionTimeLeft"
      );

      // ---------------------------------------------------
      // DEBUG
      // ---------------------------------------------------

      console.log("================================");
      console.log("QUIZ READY");
      console.log("Quiz ID:", verifiedQuiz._id);
      console.log("Attempt ID:", attempt._id);
      console.log(
        "Questions:",
        questionCount
      );
      console.log(
        "Duration:",
        duration,
        "minutes"
      );
      console.log("================================");

      // ---------------------------------------------------
      // GO TO QUIZ
      // ---------------------------------------------------

      navigate("/quiz");
    } catch (err) {
      console.error(
        "Start Quiz Error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem(
          "quizmasterToken"
        );

        localStorage.removeItem(
          "quizmasterUser"
        );

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start quiz."
      );
    } finally {
      setStartingQuiz(false);
    }
  };

  // =====================================================
  // BACK TO DASHBOARD
  // =====================================================

  const handleBack = () => {
    navigate("/dashboard");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="all-quizzes-page">

        <div className="all-quizzes-loading">

          <div className="all-quizzes-spinner"></div>

          <p>
            Loading quizzes...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="all-quizzes-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="all-quizzes-header">

        <div className="all-quizzes-header-inner">

          <button
            type="button"
            className="back-dashboard-btn"
            onClick={handleBack}
          >
            <FaArrowLeft />
            Dashboard
          </button>

          <div className="all-quizzes-title">

            <span>
              QUIZMASTER
            </span>

            <h1>
              Browse All Quizzes
            </h1>

            <p>
              Choose a quiz and challenge
              yourself today.
            </p>

          </div>

          <div className="quiz-count-badge">

            {quizzes.length}

            {" "}

            {quizzes.length === 1
              ? "Quiz"
              : "Quizzes"}

          </div>

        </div>

      </header>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="all-quizzes-error">
          {error}
        </div>
      )}

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="all-quizzes-container">

        {quizzes.length === 0 ? (

          /* ===============================================
             EMPTY STATE
          =============================================== */

          <div className="all-quizzes-empty">

            <div className="empty-icon">
              <FaGraduationCap />
            </div>

            <h2>
              No quizzes available
            </h2>

            <p>
              New quizzes will appear here
              when they are published.
            </p>

            <button
              type="button"
              onClick={handleBack}
            >
              <FaArrowLeft />
              Back to Dashboard
            </button>

          </div>

        ) : (

          /* ===============================================
             QUIZ GRID
          =============================================== */

          <div className="all-quizzes-grid">

            {quizzes.map(
              (quiz, index) => {

                // -----------------------------------------
                // QUESTION COUNT
                // -----------------------------------------

                const questionCount =
                  Array.isArray(
                    quiz.questions
                  )
                    ? quiz.questions.length
                    : Number(
                        quiz.questionCount
                      ) || 0;

                // -----------------------------------------
                // DURATION
                // -----------------------------------------

                const duration =
                  Number(
                    quiz.duration
                  ) > 0
                    ? Number(
                        quiz.duration
                      )
                    : 20;

                // -----------------------------------------
                // CARD COLORS
                // -----------------------------------------

                const colors = [
                  "brown",
                  "cream",
                  "gold",
                  "purple",
                  "blue",
                ];

                const cardColor =
                  colors[
                    index %
                      colors.length
                  ];

                return (

                  <article
                    className="all-quiz-card"
                    key={quiz._id}
                  >

                    {/* =================================
                        CARD TOP
                    ================================= */}

                    <div
                      className={`all-quiz-card-top ${cardColor}`}
                    >

                      <div className="all-quiz-category">

                        {quiz.category ||
                          "General"}

                      </div>

                      <div className="all-quiz-symbol">
                        <FaGraduationCap />
                      </div>

                    </div>

                    {/* =================================
                        CARD CONTENT
                    ================================= */}

                    <div className="all-quiz-card-content">

                      <span className="all-quiz-difficulty">

                        {quiz.difficulty ||
                          "Beginner"}

                      </span>

                      <h2>

                        {quiz.title ||
                          "Untitled Quiz"}

                      </h2>

                      {quiz.description && (

                        <p className="all-quiz-description">

                          {quiz.description}

                        </p>

                      )}

                      {/* ===============================
                          QUIZ META
                      =============================== */}

                      <div className="all-quiz-meta">

                        <span>

                          <FaCheckCircle />

                          {questionCount}

                          {" "}

                          Questions

                        </span>

                        <span>

                          <FaClock />

                          {duration}

                          {" "}

                          min

                        </span>

                      </div>

                      {/* ===============================
                          START BUTTON
                      =============================== */}

                      <button
                        type="button"
                        className="all-quiz-start-btn"
                        onClick={() =>
                          handleStartQuiz(
                            quiz
                          )
                        }
                        disabled={
                          startingQuiz
                        }
                      >

                        {startingQuiz
                          ? "Starting..."
                          : "Start Quiz"}

                        <FaArrowRight />

                      </button>

                    </div>

                  </article>

                );
              }
            )}

          </div>

        )}

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="all-quizzes-footer">

        <span>
          © 2026 QuizMaster
        </span>

        <span>
          Learn. Attempt. Improve.
        </span>

      </footer>

    </div>
  );
}

export default AllQuizzes;