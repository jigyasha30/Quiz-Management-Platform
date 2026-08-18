import {
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaGraduationCap,
  FaMedal,
  FaPlay,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AllQuizzes from "./pages/AllQuizzes";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";

import AdminQuiz from "./pages/AdminQuiz";
import AdminUsers from "./pages/AdminUsers";
import AdminCategories from "./pages/AdminCategories";
import AdminQuestions from "./pages/AdminQuestions";
import AdminAnalytics from "./pages/AdminAnalytics";

import "./App.css";

/* ==========================================
   HOME PAGE
========================================== */

function Home() {
  const navigate = useNavigate();

  const quizzes = [
    {
      id: "javascript",
      title: "JavaScript Fundamentals",
      category: "JavaScript",
      difficulty: "Intermediate",
      questions: 20,
      duration: "20 min",
      color: "purple",
    },
    {
      id: "react",
      title: "React Essentials",
      category: "React",
      difficulty: "Beginner",
      questions: 15,
      duration: "15 min",
      color: "blue",
    },
    {
      id: "web",
      title: "Web Development Basics",
      category: "HTML & CSS",
      difficulty: "Beginner",
      questions: 25,
      duration: "25 min",
      color: "orange",
    },
  ];

  /* ==========================================
     START QUIZ
  ========================================== */

  const handleStartQuiz = (quiz) => {
    localStorage.removeItem("quizResult");

    localStorage.setItem(
      "selectedQuiz",
      JSON.stringify({
        id: quiz.id,
        title: quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        questions: quiz.questions,
        duration: quiz.duration,
      })
    );

    const token = localStorage.getItem("quizmasterToken");

    if (token) {
      navigate("/quiz");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="app">

      {/* ==========================================
          NAVBAR
      ========================================== */}

      <header className="navbar">
        <div className="navbar-container">

          <Link to="/" className="brand">
            <div className="brand-icon">
              <FaGraduationCap />
            </div>

            <span>
              Quiz<span>Master</span>
            </span>
          </Link>

          <nav className="nav-links">
            <a href="#home">Home</a>
            <a href="#quizzes">Quizzes</a>
            <a href="#features">Features</a>
            <a href="#leaderboard">Leaderboard</a>
          </nav>

          <div className="nav-actions">

            <Link
              to="/login"
              className="login-btn"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="signup-btn"
            >
              Get Started
              <FaArrowRight />
            </Link>

          </div>

        </div>
      </header>

      {/* ==========================================
          HERO
      ========================================== */}

      <main>

        <section
          className="hero"
          id="home"
        >

          <div className="hero-container">

            <div className="hero-content">

              <div className="eyebrow">
                <FaBolt />
                Learn smarter. Perform better.
              </div>

              <h1>
                Challenge your
                <span>
                  knowledge.
                </span>
              </h1>

              <p>
                Take engaging quizzes, test your skills,
                track your performance, and climb the
                leaderboard.
              </p>

              <div className="hero-buttons">

                <a
                  href="#quizzes"
                  className="primary-btn"
                >
                  Explore Quizzes
                  <FaArrowRight />
                </a>

                <button
                  type="button"
                  className="secondary-btn"
                >
                  <FaPlay />
                  How it works
                </button>

              </div>

              <div className="hero-stats">

                <div className="hero-stat">
                  <strong>10K+</strong>
                  <span>Students</span>
                </div>

                <div className="stat-divider"></div>

                <div className="hero-stat">
                  <strong>500+</strong>
                  <span>Quizzes</span>
                </div>

                <div className="stat-divider"></div>

                <div className="hero-stat">
                  <strong>25K+</strong>
                  <span>Attempts</span>
                </div>

              </div>

            </div>

            <div className="hero-visual">

              <div className="floating-card top-card">

                <div className="mini-icon green">
                  <FaCheckCircle />
                </div>

                <div>
                  <strong>
                    Quiz completed!
                  </strong>

                  <span>
                    Great performance 🎉
                  </span>
                </div>

              </div>

              <div className="quiz-preview">

                <div className="preview-top">

                  <div>

                    <span className="preview-label">
                      CURRENT QUIZ
                    </span>

                    <h3>
                      JavaScript Fundamentals
                    </h3>

                  </div>

                  <div className="timer">
                    <FaClock />
                    14:32
                  </div>

                </div>

                <div className="progress-area">

                  <div className="progress-info">

                    <span>
                      Question 5 of 20
                    </span>

                    <span>
                      25%
                    </span>

                  </div>

                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>

                </div>

                <h4>
                  Which keyword is used to declare
                  a constant in JavaScript?
                </h4>

                <div className="options">

                  <div className="option">
                    <span>A</span>
                    var
                  </div>

                  <div className="option">
                    <span>B</span>
                    let
                  </div>

                  <div className="option selected">
                    <span>C</span>
                    const
                    <FaCheckCircle />
                  </div>

                  <div className="option">
                    <span>D</span>
                    static
                  </div>

                </div>

                <div className="preview-footer">

                  <button
                    type="button"
                    className="preview-next"
                  >
                    Next Question
                    <FaArrowRight />
                  </button>

                </div>

              </div>

              <div className="floating-card score-card">

                <div className="score-icon">
                  <FaTrophy />
                </div>

                <div>
                  <strong>82%</strong>

                  <span>
                    Excellent score
                  </span>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ==========================================
            FEATURES
        ========================================== */}

        <section
          className="features-section"
          id="features"
        >

          <div className="section-heading">

            <span>
              WHY QUIZMASTER
            </span>

            <h2>
              Everything you need to learn better.
            </h2>

            <p>
              A complete assessment experience designed
              for students, educators, and modern learning.
            </p>

          </div>

          <div className="features-grid">

            <div className="feature-card">

              <div className="feature-icon purple-icon">
                <FaClock />
              </div>

              <h3>
                Timed Quizzes
              </h3>

              <p>
                Challenge yourself with real-time countdown
                timers and automatic submission.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon blue-icon">
                <FaChartLine />
              </div>

              <h3>
                Track Performance
              </h3>

              <p>
                Understand your progress with scores,
                history, and performance analytics.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon orange-icon">
                <FaTrophy />
              </div>

              <h3>
                Leaderboard
              </h3>

              <p>
                Compete with other learners and see where
                you stand on the leaderboard.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon green-icon">
                <FaUsers />
              </div>

              <h3>
                Multiple Categories
              </h3>

              <p>
                Explore quizzes across programming,
                technology, and many other categories.
              </p>

            </div>

          </div>

        </section>

        {/* ==========================================
            QUIZZES
        ========================================== */}

        <section
          className="quizzes-section"
          id="quizzes"
        >

          <div className="section-heading quiz-heading">

            <div>

              <span>
                POPULAR QUIZZES
              </span>

              <h2>
                Test your knowledge.
              </h2>

            </div>

            <Link
              to="/quizzes"
              className="view-all-btn"
            >
              View all
              <FaArrowRight />
            </Link>

          </div>

          <div className="quiz-grid">

            {quizzes.map((quiz) => (

              <div
                className="quiz-card"
                key={quiz.id}
              >

                <div
                  className={`quiz-card-top ${quiz.color}`}
                >

                  <div className="quiz-category">
                    {quiz.category}
                  </div>

                  <div className="quiz-symbol">
                    <FaGraduationCap />
                  </div>

                </div>

                <div className="quiz-card-content">

                  <span className="difficulty">
                    {quiz.difficulty}
                  </span>

                  <h3>
                    {quiz.title}
                  </h3>

                  <div className="quiz-meta">

                    <span>
                      <FaCheckCircle />
                      {quiz.questions} Questions
                    </span>

                    <span>
                      <FaClock />
                      {quiz.duration}
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

              </div>

            ))}

          </div>

        </section>

        {/* ==========================================
            CTA
        ========================================== */}

        <section className="cta-section">

          <div className="cta-content">

            <div className="cta-icon">
              <FaMedal />
            </div>

            <h2>
              Ready to test yourself?
            </h2>

            <p>
              Join thousands of learners and start
              your next challenge today.
            </p>

            <Link
              to="/register"
              className="cta-btn"
            >
              Get Started
              <FaArrowRight />
            </Link>

          </div>

        </section>

      </main>

      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer className="footer">

        <div className="footer-container">

          <div className="footer-brand">

            <Link
              to="/"
              className="brand"
            >

              <div className="brand-icon">
                <FaGraduationCap />
              </div>

              <span>
                Quiz<span>Master</span>
              </span>

            </Link>

            <p>
              Learn. Attempt. Improve.
            </p>

          </div>

          <div className="footer-links">

            <a href="#home">
              Home
            </a>

            <Link to="/quizzes">
              Quizzes
            </Link>

            <a href="#features">
              Features
            </a>

            <a href="#leaderboard">
              Leaderboard
            </a>

          </div>

          <p className="copyright">
            © 2026 QuizMaster. All rights reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}

/* ==========================================
   APP / ROUTING
========================================== */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ======================================
            ROOT
        ====================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* ======================================
            HOME
        ====================================== */}

        <Route
          path="/home"
          element={<Home />}
        />

        {/* ======================================
            AUTH
        ====================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ======================================
            DASHBOARD
        ====================================== */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* ======================================
            ALL QUIZZES
        ====================================== */}

        <Route
          path="/quizzes"
          element={<AllQuizzes />}
        />

        {/* ======================================
            QUIZ
        ====================================== */}

        <Route
          path="/quiz"
          element={<Quiz />}
        />

        {/* ======================================
            RESULT
        ====================================== */}

        <Route
          path="/result"
          element={<Result />}
        />

        {/* ======================================
            ADMIN - QUIZ
        ====================================== */}

        <Route
          path="/admin/quizzes"
          element={<AdminQuiz />}
        />

        {/* ======================================
            ADMIN - USERS
        ====================================== */}

        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />

        {/* ======================================
            ADMIN - CATEGORIES
        ====================================== */}

        <Route
          path="/admin/categories"
          element={<AdminCategories />}
        />

        {/* ======================================
            ADMIN - QUESTIONS
        ====================================== */}

        <Route
          path="/admin/questions"
          element={<AdminQuestions />}
        />

        {/* ======================================
            ADMIN - ANALYTICS
        ====================================== */}

        <Route
          path="/admin/analytics"
          element={<AdminAnalytics />}
        />

        {/* ======================================
            ANALYTICS ALIAS
        ====================================== */}

        <Route
          path="/analytics"
          element={<AdminAnalytics />}
        />

        {/* ======================================
            UNKNOWN URL
        ====================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;