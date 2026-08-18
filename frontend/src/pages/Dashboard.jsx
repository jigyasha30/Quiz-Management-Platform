import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaArrowRight,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaGraduationCap,
  FaMedal,
  FaTrophy,
  FaUsers,
  FaCrown,
  FaPlus,
  FaBookOpen,
  FaTags,
} from "react-icons/fa";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import API from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [user, setUser] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD USER
  // =========================================================

  useEffect(() => {
    const savedUser = localStorage.getItem("quizmasterUser");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error("User parse error:", error);

      localStorage.removeItem("quizmasterUser");
      navigate("/login");
    }
  }, [navigate]);

  // =========================================================
  // ADMIN CHECK
  // =========================================================

  const isAdmin = user?.role === "admin";

  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("quizmasterToken");

        if (!token) {
          navigate("/login");
          return;
        }

        // -----------------------------------------------------
        // LOAD ATTEMPTS
        // -----------------------------------------------------

        let attemptData = [];

        try {
          const response = await API.get("/attempts/my");

          attemptData =
            response?.data?.attempts ||
            response?.data?.data ||
            [];

          if (!Array.isArray(attemptData)) {
            attemptData = [];
          }
        } catch (attemptError) {
          console.error("Attempts API Error:", attemptError);

          if (attemptError?.response?.status === 401) {
            localStorage.clear();
            navigate("/login");
            return;
          }

          attemptData = [];
        }

        // -----------------------------------------------------
        // LOAD QUIZZES
        // -----------------------------------------------------

        let quizData = [];

        try {
          const response = await API.get("/quizzes");

          quizData =
            response?.data?.quizzes ||
            response?.data?.data ||
            response?.data ||
            [];

          if (!Array.isArray(quizData)) {
            quizData = [];
          }
        } catch (quizError) {
          console.error("Quiz API Error:", quizError);
          quizData = [];
        }

        if (!mounted) return;

        setAttempts(attemptData);
        setQuizzes(quizData);
      } catch (error) {
        console.error("Dashboard Error:", error);

        if (mounted) {
          setError(
            error?.response?.data?.message ||
              "Unable to load dashboard."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================================================
  // LOAD ADMIN LEADERBOARD
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadLeaderboard = async () => {
      if (!isAdmin) {
        return;
      }

      try {
        setLeaderboardLoading(true);

        const response = await API.get("/attempts/leaderboard");

        const data =
          response?.data?.leaderboard ||
          response?.data?.data ||
          [];

        if (!mounted) return;

        setLeaderboard(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Leaderboard API Error:", error);

        if (mounted) {
          setLeaderboard([]);
        }
      } finally {
        if (mounted) {
          setLeaderboardLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  // =========================================================
  // COMPLETED ATTEMPTS
  // =========================================================

  const completedAttempts = attempts.filter(
    (attempt) => attempt?.status === "completed"
  );

  // =========================================================
  // STUDENT STATS
  // =========================================================

  const totalCompleted = completedAttempts.length;

  const averageScore =
    totalCompleted > 0
      ? Math.round(
          completedAttempts.reduce(
            (sum, attempt) =>
              sum + Number(attempt?.percentage ?? 0),
            0
          ) / totalCompleted
        )
      : 0;

  const passedCount = completedAttempts.filter(
    (attempt) =>
      Number(attempt?.percentage ?? 0) >= 60
  ).length;

  const failedCount = Math.max(
    0,
    totalCompleted - passedCount
  );

  // =========================================================
  // HIGHEST SCORE
  // =========================================================

  const highestScore =
    totalCompleted > 0
      ? Math.max(
          ...completedAttempts.map((attempt) =>
            Number(attempt?.percentage ?? 0)
          )
        )
      : 0;

  // =========================================================
  // TOTAL QUESTIONS ANSWERED
  // =========================================================

  const totalQuestionsAnswered =
    completedAttempts.reduce((total, attempt) => {
      const correct = Number(
        attempt?.correctAnswers ??
          attempt?.correct_answers ??
          attempt?.correct ??
          0
      );

      const incorrect = Number(
        attempt?.incorrectAnswers ??
          attempt?.incorrect_answers ??
          attempt?.incorrect ??
          0
      );

      return total + correct + incorrect;
    }, 0);

  // =========================================================
  // TOTAL TIME SPENT
  // =========================================================

  const totalTimeSpent = completedAttempts.reduce(
    (total, attempt) => {
      const rawTime = Number(attempt?.timeTaken ?? 0);

      const durationMinutes = Number(
        attempt?.quiz?.duration ??
          attempt?.duration ??
          0
      );

      const maxSeconds =
        durationMinutes > 0
          ? durationMinutes * 60
          : rawTime;

      const safeTime = Math.min(
        Math.max(rawTime, 0),
        maxSeconds
      );

      return total + safeTime;
    },
    0
  );

  // Prevent unused-variable warning if time is not displayed yet.
  void totalTimeSpent;

  // =========================================================
  // PERFORMANCE CHART DATA
  // =========================================================

  const performanceData = useMemo(() => {
    return [...completedAttempts]
      .sort((a, b) => {
        const dateA = new Date(
          a?.submittedAt ||
            a?.createdAt ||
            0
        ).getTime();

        const dateB = new Date(
          b?.submittedAt ||
            b?.createdAt ||
            0
        ).getTime();

        return dateA - dateB;
      })
      .slice(-8)
      .map((attempt, index) => {
        const score = Math.round(
          Number(attempt?.percentage ?? 0)
        );

        let title =
          attempt?.quiz?.title ||
          attempt?.quizTitle ||
          "Quiz";

        if (title.length > 18) {
          title = `${title.substring(0, 18)}...`;
        }

        return {
          name: `${index + 1}. ${title}`,
          score,
        };
      });
  }, [completedAttempts]);

  // =========================================================
  // ADMIN STATS
  // =========================================================

  const publishedQuizzes = quizzes.filter(
    (quiz) => quiz?.isPublished !== false
  );

  const totalQuizzes = quizzes.length;

  const publishedCount = publishedQuizzes.length;

  const availableCount = quizzes.filter(
    (quiz) =>
      quiz?.isPublished !== false &&
      quiz?.isActive !== false
  ).length;

  const totalAttempts = attempts.length;

  // =========================================================
  // AVAILABLE QUIZZES
  // =========================================================

  const availableQuizzes = quizzes.filter((quiz) => {
    if (!quiz || !quiz._id) {
      return false;
    }

    if (quiz.isPublished === false) {
      return false;
    }

    if (quiz.isActive === false) {
      return false;
    }

    return true;
  });

  const recommendedQuizzes = availableQuizzes.slice(0, 3);

  // =========================================================
  // RECENT ATTEMPTS
  // =========================================================

  const recentAttempts = [...completedAttempts]
    .sort((a, b) => {
      const dateA = new Date(
        a?.submittedAt ||
          a?.createdAt ||
          0
      ).getTime();

      const dateB = new Date(
        b?.submittedAt ||
          b?.createdAt ||
          0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);

  // =========================================================
  // START QUIZ
  // =========================================================

  const handleStartQuiz = async (quiz) => {
    if (!quiz?._id) {
      setError("Invalid quiz.");
      return;
    }

    try {
      setError("");

      // Clear previous quiz state
      localStorage.removeItem("quizResult");
      localStorage.removeItem("currentQuestionIndex");
      localStorage.removeItem("questionTimeLeft");
      localStorage.removeItem("quizAnswers");

      // Create new attempt
      const response = await API.post(
        `/attempts/start/${quiz._id}`
      );

      const attempt =
        response?.data?.attempt ||
        response?.data?.data;

      if (!attempt?._id) {
        throw new Error(
          "Unable to create quiz attempt."
        );
      }

      // Get question count
      const questionCount = Array.isArray(
        quiz.questions
      )
        ? quiz.questions.length
        : Number(
            quiz.questionCount ??
              quiz.questionsCount ??
              quiz.totalQuestions ??
              0
          );

      // Get duration
      const duration =
        Number(quiz.duration) || 20;

      // Save selected quiz
      const selectedQuiz = {
        id: quiz._id,
        _id: quiz._id,

        title:
          quiz.title || "Quiz",

        description:
          quiz.description || "",

        category:
          quiz.category || "General",

        difficulty:
          quiz.difficulty || "Beginner",

        questions: questionCount,

        duration,

        totalPoints:
          Number(quiz.totalPoints ?? 0),

        questionData:
          Array.isArray(quiz.questions)
            ? quiz.questions
            : [],
      };

      localStorage.setItem(
        "selectedQuiz",
        JSON.stringify(selectedQuiz)
      );

      // Save current attempt
      localStorage.setItem(
        "currentAttempt",
        JSON.stringify(attempt)
      );

      // Reset question index
      localStorage.setItem(
        "currentQuestionIndex",
        "0"
      );

      // Reset answers
      localStorage.setItem(
        "quizAnswers",
        JSON.stringify({})
      );

      // Start quiz
      navigate("/quiz");
    } catch (error) {
      console.error(
        "Start Quiz Error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to start quiz."
      );
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("quizmasterToken");
    localStorage.removeItem("quizmasterUser");
    localStorage.removeItem("selectedQuiz");
    localStorage.removeItem("currentAttempt");
    localStorage.removeItem("quizResult");
    localStorage.removeItem("currentQuestionIndex");
    localStorage.removeItem("questionTimeLeft");
    localStorage.removeItem("quizAnswers");

    navigate("/login");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>

          <p>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ADMIN DASHBOARD
  // =========================================================

  if (isAdmin) {
    return (
      <div className="dashboard-page admin-dashboard">

        {/* HEADER */}

        <header className="dashboard-header">
          <div className="dashboard-header-inner">

            <Link
              to="/dashboard"
              className="dashboard-logo"
            >
              <div className="dashboard-logo-icon">
                <FaGraduationCap />
              </div>

              <span>
                Quiz
                <span>Master</span>
              </span>
            </Link>

            <nav className="dashboard-nav">

              <Link
                to="/dashboard"
                className="active"
              >
                Dashboard
              </Link>

              <Link to="/quizzes">
                Browse Quizzes
              </Link>

              <Link to="/analytics">
                Analytics
              </Link>

              <Link to="/admin/categories">
                Categories
              </Link>

              <a href="#leaderboard">
                Leaderboard
              </a>

              <a href="#admin-tools">
                Admin Tools
              </a>

            </nav>

            <div className="admin-header-actions">

              <Link
                to="/analytics"
                className="header-create-btn"
              >
                <FaChartLine />
                Analytics
              </Link>

              <Link
                to="/admin/categories"
                className="header-create-btn"
              >
                <FaTags />
                Categories
              </Link>

              <Link
                to="/admin/quizzes"
                className="header-create-btn"
              >
                <FaPlus />
                Create Quiz
              </Link>

              <button
                type="button"
                className="dashboard-logout"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        <main className="dashboard-container">

          {/* ADMIN WELCOME */}

          <section className="dashboard-welcome admin-welcome">

            <div className="welcome-content">

              <span className="dashboard-eyebrow">
                ADMIN DASHBOARD
              </span>

              <h1>
                Welcome back,{" "}
                {user?.name || "Admin"} 👑
              </h1>

              <p>
                Manage quizzes, categories,
                users and keep your learning
                platform updated.
              </p>

            </div>

            <div className="dashboard-user-card">

              <div className="dashboard-avatar">
                {(user?.name || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {user?.name || "Admin"}
                </strong>

                <span>
                  Administrator
                </span>
              </div>

            </div>

          </section>

          {/* ADMIN TOOLS */}

          <section
            className="admin-tools-section"
            id="admin-tools"
          >

            <div className="section-heading">

              <div>
                <span>
                  ADMIN TOOLS
                </span>

                <h2>
                  Manage your platform
                </h2>
              </div>

            </div>

            <div className="admin-tool-grid">

              {/* CREATE QUIZ */}

              <div className="admin-tool-card create-tool">

                <div className="admin-tool-icon">
                  <FaPlus />
                </div>

                <span>
                  CREATE NEW QUIZ
                </span>

                <h3>
                  Build your next quiz
                </h3>

                <p>
                  Add questions, set
                  duration, difficulty and
                  publish quizzes for
                  students.
                </p>

                <Link
                  to="/admin/quizzes"
                  className="admin-tool-btn"
                >
                  Create New Quiz
                  <FaArrowRight />
                </Link>

              </div>

              {/* MANAGE QUIZZES */}

              <div className="admin-tool-card">

                <div className="admin-tool-icon">
                  <FaBookOpen />
                </div>

                <span>
                  MANAGE QUIZZES
                </span>

                <h3>
                  Quiz Library
                </h3>

                <p>
                  View published quizzes
                  and manage your
                  assessment content.
                </p>

                <Link
                  to="/quizzes"
                  className="admin-tool-btn secondary"
                >
                  View Quizzes
                  <FaArrowRight />
                </Link>

              </div>

              {/* ANALYTICS */}

              <div className="admin-tool-card analytics-management-tool">

                <div className="admin-tool-icon">
                  <FaChartLine />
                </div>

                <span>
                  PERFORMANCE ANALYTICS
                </span>

                <h3>
                  View Analytics
                </h3>

                <p>
                  Track quiz attempts,
                  scores and overall
                  platform performance.
                </p>

                <Link
                  to="/analytics"
                  className="admin-tool-btn secondary"
                >
                  View Analytics
                  <FaArrowRight />
                </Link>

              </div>

              {/* CATEGORIES */}

              <div className="admin-tool-card category-management-tool">

                <div className="admin-tool-icon">
                  <FaTags />
                </div>

                <span>
                  CATEGORY MANAGEMENT
                </span>

                <h3>
                  Manage Categories
                </h3>

                <p>
                  Create, edit and delete
                  quiz categories to keep
                  your assessment library
                  organized.
                </p>

                <Link
                  to="/admin/categories"
                  className="admin-tool-btn secondary"
                >
                  Manage Categories
                  <FaArrowRight />
                </Link>

              </div>

              {/* USERS */}

              <div className="admin-tool-card user-management-tool">

                <div className="admin-tool-icon">
                  <FaUsers />
                </div>

                <span>
                  USER MANAGEMENT
                </span>

                <h3>
                  Manage Users
                </h3>

                <p>
                  Search students by name
                  or email, view performance
                  and control account access.
                </p>

                <Link
                  to="/admin/users"
                  className="admin-tool-btn secondary"
                >
                  Manage Users
                  <FaArrowRight />
                </Link>

              </div>

              {/* PLATFORM */}

              <div className="admin-tool-card">

                <div className="admin-tool-icon">
                  <FaChartLine />
                </div>

                <span>
                  QUIZ PLATFORM
                </span>

                <h3>
                  Explore Platform
                </h3>

                <p>
                  Keep your quizzes
                  organized and provide
                  learners with fresh
                  challenges.
                </p>

                <Link
                  to="/quizzes"
                  className="admin-tool-btn secondary"
                >
                  Explore Platform
                  <FaArrowRight />
                </Link>

              </div>

            </div>

          </section>

          {/* ADMIN HERO */}

          <section className="dashboard-hero admin-hero">

            <div className="hero-content">

              <span className="hero-label">
                QUIZMASTER ADMIN
              </span>

              <h2>
                Build engaging quizzes.
              </h2>

              <p>
                Create quizzes, organize
                categories and publish them
                for learners.
              </p>

              <div className="hero-actions">

                <Link
                  to="/admin/quizzes"
                  className="hero-button"
                >
                  Create New Quiz
                  <FaPlus />
                </Link>

                <Link
                  to="/analytics"
                  className="hero-button hero-button-light"
                >
                  View Analytics
                  <FaChartLine />
                </Link>

              </div>

            </div>

            <div className="hero-icon">
              <FaTrophy />
            </div>

          </section>

          {/* ADMIN STATS */}

          <section className="dashboard-stats">

            <div className="dashboard-stat-card">

              <div className="stat-icon completed">
                <FaBookOpen />
              </div>

              <div>
                <span>
                  TOTAL QUIZZES
                </span>

                <strong>
                  {totalQuizzes}
                </strong>

                <small>
                  Created quizzes
                </small>
              </div>

            </div>

            <div className="dashboard-stat-card">

              <div className="stat-icon score">
                <FaCheckCircle />
              </div>

              <div>
                <span>
                  PUBLISHED
                </span>

                <strong>
                  {publishedCount}
                </strong>

                <small>
                  Visible to students
                </small>
              </div>

            </div>

            <div className="dashboard-stat-card">

              <div className="stat-icon time">
                <FaChartLine />
              </div>

              <div>
                <span>
                  AVAILABLE
                </span>

                <strong>
                  {availableCount}
                </strong>

                <small>
                  Active quizzes
                </small>
              </div>

            </div>

            <div className="dashboard-stat-card">

              <div className="stat-icon passed">
                <FaUsers />
              </div>

              <div>
                <span>
                  ATTEMPTS
                </span>

                <strong>
                  {totalAttempts}
                </strong>

                <small>
                  Quiz attempts
                </small>
              </div>

            </div>

          </section>

          {/* QUIZ LIBRARY */}

          <section className="dashboard-section">

            <div className="section-heading">

              <div>
                <span>
                  QUIZ LIBRARY
                </span>

                <h2>
                  Published quizzes
                </h2>
              </div>

              <Link
                to="/quizzes"
                className="dashboard-view-all"
              >
                View all
                <FaArrowRight />
              </Link>

            </div>

            {publishedQuizzes.length === 0 ? (

              <div className="dashboard-empty">

                <FaBookOpen />

                <h3>
                  No published quizzes
                </h3>

                <p>
                  Create your first quiz
                  to make it available
                  to students.
                </p>

                <Link
                  to="/admin/quizzes"
                  className="dashboard-empty-button"
                >
                  Create Quiz
                  <FaPlus />
                </Link>

              </div>

            ) : (

              <div className="quiz-cards">

                {publishedQuizzes
                  .slice(0, 3)
                  .map((quiz, index) => {

                    const questionCount =
                      Array.isArray(quiz.questions)
                        ? quiz.questions.length
                        : Number(
                            quiz.questionCount ??
                              quiz.questionsCount ??
                              quiz.totalQuestions ??
                              0
                          );

                    const duration =
                      Number(quiz.duration) || 20;

                    const colors = [
                      "brown",
                      "cream",
                      "gold",
                    ];

                    return (
                      <article
                        className="quiz-card"
                        key={quiz._id}
                      >

                        <div
                          className={`quiz-card-top ${
                            colors[index % colors.length]
                          }`}
                        >

                          <span>
                            {quiz.category ||
                              "General"}
                          </span>

                          <FaGraduationCap />

                        </div>

                        <div className="quiz-card-content">

                          <span className="quiz-difficulty">
                            {quiz.difficulty ||
                              "Beginner"}
                          </span>

                          <h3>
                            {quiz.title ||
                              "Untitled Quiz"}
                          </h3>

                          <p>
                            {quiz.description ||
                              "Test your knowledge and improve your skills."}
                          </p>

                          <div className="quiz-card-meta">

                            <span>
                              <FaCheckCircle />
                              {questionCount}{" "}
                              Questions
                            </span>

                            <span>
                              <FaClock />
                              {duration} min
                            </span>

                          </div>

                          <Link
                            to="/quizzes"
                            className="start-quiz-btn"
                          >
                            View Quiz
                            <FaArrowRight />
                          </Link>

                        </div>

                      </article>
                    );
                  })}

              </div>

            )}

          </section>

          {/* LEADERBOARD */}

          <section
            className="leaderboard-section"
            id="leaderboard"
          >

            <div className="section-heading">

              <div>
                <span>
                  LEADERBOARD
                </span>

                <h2>
                  Top performing students
                </h2>
              </div>

            </div>

            <div className="leaderboard-card">

              {leaderboardLoading ? (

                <div className="leaderboard-empty">

                  <div className="dashboard-spinner"></div>

                  <p>
                    Loading leaderboard...
                  </p>

                </div>

              ) : leaderboard.length === 0 ? (

                <div className="leaderboard-empty">

                  <FaTrophy />

                  <h3>
                    No leaderboard data yet
                  </h3>

                  <p>
                    Student scores will
                    appear here after
                    completed quiz
                    attempts.
                  </p>

                </div>

              ) : (

                <div className="leaderboard-list">

                  {leaderboard.map((student) => {

                    const rank =
                      Number(student.rank) || 0;

                    const score =
                      Number(
                        student.averageScore ?? 0
                      );

                    const attemptsCount =
                      Number(
                        student.attempts ?? 0
                      );

                    return (
                      <div
                        className={`leaderboard-item ${
                          rank <= 3
                            ? "top-rank"
                            : ""
                        }`}
                        key={student._id}
                      >

                        <div
                          className={`leaderboard-rank rank-${rank}`}
                        >
                          {rank === 1 ? (
                            <FaCrown />
                          ) : (
                            rank
                          )}
                        </div>

                        <div className="leaderboard-avatar">
                          {(
                            student.name ||
                            "S"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="leaderboard-student">

                          <strong>
                            {student.name ||
                              "Student"}
                          </strong>

                          <span>
                            {attemptsCount}{" "}
                            {attemptsCount === 1
                              ? "attempt"
                              : "attempts"}
                          </span>

                        </div>

                        <div className="leaderboard-score">

                          <strong>
                            {score}%
                          </strong>

                          <span>
                            Average Score
                          </span>

                        </div>

                      </div>
                    );
                  })}

                </div>
              )}

            </div>

          </section>

        </main>

        {/* FOOTER */}

        <footer className="dashboard-footer">

          <Link
            to="/dashboard"
            className="footer-logo"
          >
            <FaGraduationCap />
            QuizMaster
          </Link>

          <span>
            Admin Panel
          </span>

          <span>
            © 2026 QuizMaster
          </span>

        </footer>

      </div>
    );
  }

  // =========================================================
  // STUDENT DASHBOARD
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <header className="dashboard-header">

        <div className="dashboard-header-inner">

          <Link
            to="/dashboard"
            className="dashboard-logo"
          >

            <div className="dashboard-logo-icon">
              <FaGraduationCap />
            </div>

            <span>
              Quiz
              <span>
                Master
              </span>
            </span>

          </Link>

          <nav className="dashboard-nav">

            <Link
              to="/dashboard"
              className="active"
            >
              Dashboard
            </Link>

            <Link to="/quizzes">
              Browse Quizzes
            </Link>

            <a href="#leaderboard">
              Leaderboard
            </a>

          </nav>

          <button
            type="button"
            className="dashboard-logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* ERROR */}

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <main className="dashboard-container">

        {/* WELCOME */}

        <section className="dashboard-welcome">

          <div className="welcome-content">

            <span className="dashboard-eyebrow">
              STUDENT DASHBOARD
            </span>

            <h1>
              Welcome back,{" "}
              {user?.name || "Jigyasha"} ! 👋
            </h1>

            <p>
              Keep learning and improve
              your quiz performance.
            </p>

          </div>

          <div className="dashboard-user-card">

            <div className="dashboard-avatar">

              {(user?.name || "J")
                .charAt(0)
                .toUpperCase()}

            </div>

            <div>

              <strong>
                {user?.name || "Jigyasha"}
              </strong>

              <span>
                Learner
              </span>

            </div>

          </div>

        </section>

        {/* HERO */}

        <section className="dashboard-hero">

          <div className="hero-content">

            <span className="hero-label">
              READY FOR A CHALLENGE?
            </span>

            <h2>
              Test your knowledge today.
            </h2>

            <p>
              Choose a quiz, challenge
              yourself, and track your
              progress.
            </p>

            <div className="hero-actions">

              <Link
                to="/quizzes"
                className="hero-button"
              >
                Explore Quizzes
                <FaArrowRight />
              </Link>

            </div>

          </div>

          <div className="hero-icon">
            <FaTrophy />
          </div>

        </section>

        {/* STUDENT STATS */}

        <section className="dashboard-stats">

          {/* COMPLETED */}

          <div className="dashboard-stat-card">

            <div className="stat-icon completed">
              <FaCheckCircle />
            </div>

            <div>

              <span>
                QUIZZES COMPLETED
              </span>

              <strong>
                {totalCompleted}
              </strong>

              <small>
                Total completed
              </small>

            </div>

          </div>

          {/* AVERAGE */}

          <div className="dashboard-stat-card">

            <div className="stat-icon score">
              <FaChartLine />
            </div>

            <div>

              <span>
                AVERAGE SCORE
              </span>

              <strong>
                {averageScore}%
              </strong>

              <small>
                Keep practicing
              </small>

            </div>

          </div>

          {/* HIGHEST */}

          <div className="dashboard-stat-card">

            <div className="stat-icon time">
              <FaTrophy />
            </div>

            <div>

              <span>
                HIGHEST SCORE
              </span>

              <strong>
                {highestScore}%
              </strong>

              <small>
                Best quiz score
              </small>

            </div>

          </div>

          {/* PASSED */}

          <div className="dashboard-stat-card">

            <div className="stat-icon passed">
              <FaMedal />
            </div>

            <div>

              <span>
                PASSED
              </span>

              <strong>
                {passedCount}
              </strong>

              <small>
                {failedCount} need practice
              </small>

            </div>

          </div>

          {/* QUESTIONS ANSWERED */}

          <div className="dashboard-stat-card">

            <div className="stat-icon completed">
              <FaCheckCircle />
            </div>

            <div>

              <span>
                QUESTIONS ANSWERED
              </span>

              <strong>
                {totalQuestionsAnswered}
              </strong>

              <small>
                Correct + incorrect
              </small>

            </div>

          </div>

        </section>

        {/* RECOMMENDED QUIZZES */}

        <section className="dashboard-section recommended-section">

          <div className="section-heading">

            <div>

              <span>
                RECOMMENDED
              </span>

              <h2>
                Popular quizzes
              </h2>

            </div>

            <Link
              to="/quizzes"
              className="dashboard-view-all"
            >
              View all
              <FaArrowRight />
            </Link>

          </div>

          {recommendedQuizzes.length === 0 ? (

            <div className="dashboard-empty">

              <FaGraduationCap />

              <h3>
                No quizzes available
              </h3>

              <p>
                New quizzes will appear
                here when they are
                published.
              </p>

              <Link
                to="/quizzes"
                className="dashboard-empty-button"
              >
                Browse Quizzes
                <FaArrowRight />
              </Link>

            </div>

          ) : (

            <div className="quiz-cards">

              {recommendedQuizzes.map(
                (quiz, index) => {

                  const questionCount =
                    Array.isArray(
                      quiz.questions
                    )
                      ? quiz.questions.length
                      : Number(
                          quiz.questionCount ??
                            quiz.questionsCount ??
                            quiz.totalQuestions ??
                            0
                        );

                  const duration =
                    Number(quiz.duration) || 20;

                  const colors = [
                    "brown",
                    "cream",
                    "gold",
                  ];

                  return (
                    <article
                      className="quiz-card"
                      key={quiz._id}
                    >

                      <div
                        className={`quiz-card-top ${
                          colors[
                            index % colors.length
                          ]
                        }`}
                      >

                        <span>
                          {quiz.category ||
                            "General"}
                        </span>

                        <FaGraduationCap />

                      </div>

                      <div className="quiz-card-content">

                        <span className="quiz-difficulty">
                          {quiz.difficulty ||
                            "Beginner"}
                        </span>

                        <h3>
                          {quiz.title ||
                            "Untitled Quiz"}
                        </h3>

                        <p>
                          {quiz.description ||
                            "Test your knowledge and improve your skills."}
                        </p>

                        <div className="quiz-card-meta">

                          <span>
                            <FaCheckCircle />
                            {questionCount}{" "}
                            Questions
                          </span>

                          <span>
                            <FaClock />
                            {duration} min
                          </span>

                        </div>

                        <button
                          type="button"
                          className="start-quiz-btn"
                          onClick={() =>
                            handleStartQuiz(quiz)
                          }
                        >
                          Start Quiz
                          <FaArrowRight />
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* RECENT ACTIVITY */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <span>
                YOUR ACTIVITY
              </span>

              <h2>
                Recent attempts
              </h2>

            </div>

          </div>

          <div className="activity-card">

            {recentAttempts.length === 0 ? (

              <div className="activity-empty">

                <FaClock />

                <p>
                  No quiz attempts yet.
                </p>

              </div>

            ) : (

              recentAttempts.map(
                (attempt) => {

                  const title =
                    attempt?.quiz?.title ||
                    attempt?.quizTitle ||
                    "Quiz";

                  const percentage =
                    Number(
                      attempt?.percentage ??
                        0
                    );

                  const date =
                    attempt?.submittedAt ||
                    attempt?.createdAt;

                  return (
                    <div
                      className="activity-item"
                      key={attempt._id}
                    >

                      <div className="activity-icon">
                        <FaCheckCircle />
                      </div>

                      <div className="activity-info">

                        <strong>
                          {title}
                        </strong>

                        <span>
                          Completed{" "}
                          {date
                            ? new Date(
                                date
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : ""}
                        </span>

                      </div>

                      <div
                        className={`activity-score ${
                          percentage >= 60
                            ? "passed"
                            : "failed"
                        }`}
                      >
                        {percentage}%
                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </section>

        {/* PERFORMANCE CHART */}

        <section
          className="dashboard-performance-chart"
          id="performance"
        >

          <div className="section-heading">

            <div>

              <span>
                PERFORMANCE ANALYTICS
              </span>

              <h2>
                Your performance
              </h2>

            </div>

            <div className="chart-summary">

              <FaChartLine />

              <span>
                {totalCompleted}{" "}
                {totalCompleted === 1
                  ? "attempt"
                  : "attempts"}
              </span>

            </div>

          </div>

          <div className="performance-chart-card">

            {performanceData.length === 0 ? (

              <div className="chart-empty">

                <div className="chart-empty-icon">
                  <FaChartLine />
                </div>

                <h3>
                  No performance data yet
                </h3>

                <p>
                  Complete a quiz to see
                  your performance chart
                  here.
                </p>

                <Link
                  to="/quizzes"
                  className="dashboard-empty-button"
                >
                  Take a Quiz
                  <FaArrowRight />
                </Link>

              </div>

            ) : (

              <div className="performance-chart-wrapper">

                <div className="chart-header">

                  <div>

                    <strong>
                      Quiz scores
                    </strong>

                    <span>
                      Your latest quiz
                      performance
                    </span>

                  </div>

                  <div className="chart-average">

                    <span>
                      Average
                    </span>

                    <strong>
                      {averageScore}%
                    </strong>

                  </div>

                </div>

                <div className="chart-container">

                  <ResponsiveContainer
                    width="100%"
                    height={330}
                  >

                    <LineChart
                      data={performanceData}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 0,
                        bottom: 55,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 11,
                        }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                        height={65}
                      />

                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) =>
                          `${value}%`
                        }
                        tick={{
                          fontSize: 12,
                        }}
                      />

                      <Tooltip
                        formatter={(value) => [
                          `${value}%`,
                          "Score",
                        ]}
                        labelFormatter={(label) =>
                          label
                        }
                        contentStyle={{
                          borderRadius: "12px",
                          border:
                            "1px solid #eadfce",
                          boxShadow:
                            "0 10px 30px rgba(74, 53, 36, 0.12)",
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#8b5e3c"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          strokeWidth: 2,
                          fill: "#fffaf2",
                        }}
                        activeDot={{
                          r: 7,
                        }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

                <div className="chart-footer">

                  <div>
                    <span>
                      Highest
                    </span>

                    <strong>
                      {highestScore}%
                    </strong>
                  </div>

                  <div>
                    <span>
                      Passed
                    </span>

                    <strong>
                      {passedCount}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Practice needed
                    </span>

                    <strong>
                      {failedCount}
                    </strong>
                  </div>

                </div>

              </div>

            )}

          </div>

        </section>

        {/* PERFORMANCE SUMMARY */}

        <section
          className="dashboard-performance"
          id="leaderboard"
        >

          <div className="performance-heading">

            <span>
              PERFORMANCE
            </span>

            <h2>
              Your progress
            </h2>

          </div>

          <div className="performance-card">

            <div
              className="performance-circle"
              style={{
                "--score": averageScore,
              }}
            >

              <div>

                <strong>
                  {averageScore}%
                </strong>

                <span>
                  Average Score
                </span>

              </div>

            </div>

            <div className="performance-content">

              <h3>
                {averageScore >= 80
                  ? "Excellent work!"
                  : averageScore >= 60
                  ? "Good job!"
                  : "Keep practicing!"}
              </h3>

              <p>
                Every attempt helps you
                improve your knowledge
                and performance.
              </p>

              <div className="performance-stats">

                <div>

                  <strong>
                    {totalCompleted}
                  </strong>

                  <span>
                    Attempts
                  </span>

                </div>

                <div>

                  <strong>
                    {passedCount}
                  </strong>

                  <span>
                    Passed
                  </span>

                </div>

                <div>

                  <strong>
                    {failedCount}
                  </strong>

                  <span>
                    Needs Practice
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}

      <footer className="dashboard-footer">

        <Link
          to="/dashboard"
          className="footer-logo"
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

export default Dashboard;