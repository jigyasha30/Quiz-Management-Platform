import { useEffect, useState } from "react";
import {
  FaChartLine,
  FaUsers,
  FaClipboardList,
  FaTrophy,
  FaCheckCircle,
  FaTimesCircle,
  FaBook,
  FaSyncAlt,
} from "react-icons/fa";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Line, Bar, Doughnut } from "react-chartjs-2";

import API from "../services/api";
import "./AdminAnalytics.css";

// ==========================================
// CHART.JS REGISTRATION
// ==========================================

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// ==========================================
// COMPONENT
// ==========================================

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return (
      localStorage.getItem("quizmasterToken") ||
      localStorage.getItem("token")
    );
  };

  // ==========================================
  // API CONFIG
  // ==========================================

  const getConfig = () => {
    const token = getToken();

    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // ==========================================
  // FETCH ANALYTICS
  // ==========================================

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await API.get(
        "/analytics",
        getConfig()
      );

      if (response.data?.success) {
        setAnalytics(response.data.analytics);
      } else {
        setAnalytics(null);

        setError(
          response.data?.message ||
            "Failed to load analytics"
        );
      }
    } catch (err) {
      console.error(
        "Fetch Analytics Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load analytics"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatChartDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="admin-analytics-page">
        <div className="admin-analytics-container">
          <div className="analytics-loading">
            <div className="analytics-spinner"></div>

            <h3>Loading analytics...</h3>

            <p>
              Please wait while we prepare your
              dashboard statistics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error && !analytics) {
    return (
      <div className="admin-analytics-page">
        <div className="admin-analytics-container">
          <div className="analytics-error">
            <FaTimesCircle />

            <h3>Unable to load analytics</h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={() => fetchAnalytics()}
            >
              <FaSyncAlt />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SAFE ANALYTICS DATA
  // ==========================================

  const overview = analytics?.overview || {};

  const studentRegistrations =
    analytics?.studentRegistrations || [];

  const attemptsOverTime =
    analytics?.attemptsOverTime || [];

  const passFailRatio =
    analytics?.passFailRatio || {
      passed: 0,
      failed: 0,
      passRate: 0,
      failRate: 0,
    };

  const popularQuizzes =
    analytics?.popularQuizzes || [];

  const popularCategories =
    analytics?.popularCategories || [];

  const difficultyStats =
    analytics?.difficultyStats || [];

  // ==========================================
  // ATTEMPTS LINE CHART
  // ==========================================

  const attemptsChartData = {
    labels: attemptsOverTime.map((item) =>
      formatChartDate(item.date)
    ),

    datasets: [
      {
        label: "Quiz Attempts",

        data: attemptsOverTime.map(
          (item) => item.attempts || 0
        ),

        tension: 0.4,

        borderWidth: 3,

        pointRadius: 4,

        pointHoverRadius: 6,

        fill: false,
      },
    ],
  };

  // ==========================================
  // REGISTRATION BAR CHART
  // ==========================================

  const registrationChartData = {
    labels: studentRegistrations.map(
      (item) => formatChartDate(item.date)
    ),

    datasets: [
      {
        label: "Student Registrations",

        data: studentRegistrations.map(
          (item) => item.count || 0
        ),

        borderWidth: 1,

        borderRadius: 6,
      },
    ],
  };

  // ==========================================
  // PASS / FAIL DOUGHNUT
  // ==========================================

  const passFailChartData = {
    labels: ["Passed", "Failed"],

    datasets: [
      {
        data: [
          passFailRatio.passed || 0,
          passFailRatio.failed || 0,
        ],

        borderWidth: 2,
      },
    ],
  };

  // ==========================================
  // POPULAR QUIZZES BAR CHART
  // ==========================================

  const popularQuizChartData = {
    labels: popularQuizzes.map(
      (quiz) => quiz.title || "Unknown Quiz"
    ),

    datasets: [
      {
        label: "Attempts",

        data: popularQuizzes.map(
          (quiz) => quiz.attempts || 0
        ),

        borderWidth: 1,

        borderRadius: 6,
      },
    ],
  };

  // ==========================================
  // CATEGORY BAR CHART
  // ==========================================

  const categoryChartData = {
    labels: popularCategories.map(
      (item) => item.category || "Unknown"
    ),

    datasets: [
      {
        label: "Attempts",

        data: popularCategories.map(
          (item) => item.attempts || 0
        ),

        borderWidth: 1,

        borderRadius: 6,
      },
    ],
  };

  // ==========================================
  // DIFFICULTY CHART
  // ==========================================

  const difficultyChartData = {
    labels: difficultyStats.map(
      (item) =>
        item.difficulty || "Unknown"
    ),

    datasets: [
      {
        label: "Quizzes",

        data: difficultyStats.map(
          (item) => item.count || 0
        ),

        borderWidth: 1,

        borderRadius: 6,
      },
    ],
  };

  // ==========================================
  // CHART OPTIONS
  // ==========================================

  const lineChartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
      },

      tooltip: {
        mode: "index",
        intersect: false,
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        ticks: {
          precision: 0,
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        ticks: {
          precision: 0,
        },
      },
    },
  };

  const horizontalBarOptions = {
    responsive: true,

    maintainAspectRatio: false,

    indexAxis: "y",

    plugins: {
      legend: {
        display: true,
      },
    },

    scales: {
      x: {
        beginAtZero: true,

        ticks: {
          precision: 0,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "bottom",
      },
    },

    cutout: "65%",
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="admin-analytics-page">
      <div className="admin-analytics-container">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="admin-analytics-header">

          <div>
            <p className="admin-analytics-label">
              ADMIN TOOLS
            </p>

            <h1>Analytics Dashboard</h1>

            <p className="admin-analytics-subtitle">
              Monitor students, quizzes, attempts,
              scores, and overall platform
              performance.
            </p>
          </div>

          <button
            type="button"
            className="analytics-refresh-button"
            onClick={() =>
              fetchAnalytics(true)
            }
            disabled={refreshing}
          >
            <FaSyncAlt
              className={
                refreshing
                  ? "analytics-refresh-icon"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {/* =====================================
            ERROR
        ====================================== */}

        {error && (
          <div className="analytics-top-error">
            <span>{error}</span>
          </div>
        )}

        {/* =====================================
            OVERVIEW CARDS
        ====================================== */}

        <div className="analytics-overview-grid">

          {/* STUDENTS */}

          <div className="analytics-overview-card">

            <div className="analytics-card-icon">
              <FaUsers />
            </div>

            <div>
              <span>Total Students</span>

              <strong>
                {overview.totalStudents || 0}
              </strong>

              <small>
                {overview.activeStudents || 0} active
              </small>
            </div>

          </div>

          {/* QUIZZES */}

          <div className="analytics-overview-card">

            <div className="analytics-card-icon">
              <FaBook />
            </div>

            <div>
              <span>Total Quizzes</span>

              <strong>
                {overview.totalQuizzes || 0}
              </strong>

              <small>
                Available quizzes
              </small>
            </div>

          </div>

          {/* ATTEMPTS */}

          <div className="analytics-overview-card">

            <div className="analytics-card-icon">
              <FaClipboardList />
            </div>

            <div>
              <span>Quiz Attempts</span>

              <strong>
                {overview.totalAttempts || 0}
              </strong>

              <small>
                Completed attempts
              </small>
            </div>

          </div>

          {/* AVERAGE */}

          <div className="analytics-overview-card">

            <div className="analytics-card-icon">
              <FaChartLine />
            </div>

            <div>
              <span>Average Score</span>

              <strong>
                {overview.averageScore || 0}%
              </strong>

              <small>
                Across completed quizzes
              </small>
            </div>

          </div>

          {/* PASS RATE */}

          <div className="analytics-overview-card">

            <div className="analytics-card-icon">
              <FaCheckCircle />
            </div>

            <div>
              <span>Pass Rate</span>

              <strong>
                {overview.passRate || 0}%
              </strong>

              <small>
                {overview.passedAttempts || 0} passed
              </small>
            </div>

          </div>

          {/* FAIL RATE */}

          <div className="analytics-overview-card">

            <div className="analytics-card-icon">
              <FaTimesCircle />
            </div>

            <div>
              <span>Fail Rate</span>

              <strong>
                {overview.failRate || 0}%
              </strong>

              <small>
                {overview.failedAttempts || 0} failed
              </small>
            </div>

          </div>

        </div>

        {/* =====================================
            ATTEMPTS + REGISTRATIONS
        ====================================== */}

        <div className="analytics-chart-grid">

          {/* ATTEMPTS OVER TIME */}

          <div className="analytics-chart-card">

            <div className="analytics-chart-header">

              <div>
                <h2>Quiz Attempts Over Time</h2>

                <p>
                  Completed quiz attempts by date.
                </p>
              </div>

              <FaChartLine />

            </div>

            <div className="analytics-chart-wrapper">

              {attemptsOverTime.length > 0 ? (
                <Line
                  data={attemptsChartData}
                  options={lineChartOptions}
                />
              ) : (
                <div className="analytics-no-data">
                  No attempt data available.
                </div>
              )}

            </div>

          </div>

          {/* STUDENT REGISTRATIONS */}

          <div className="analytics-chart-card">

            <div className="analytics-chart-header">

              <div>
                <h2>Student Registrations</h2>

                <p>
                  New student registrations by date.
                </p>
              </div>

              <FaUsers />

            </div>

            <div className="analytics-chart-wrapper">

              {studentRegistrations.length > 0 ? (
                <Bar
                  data={registrationChartData}
                  options={barChartOptions}
                />
              ) : (
                <div className="analytics-no-data">
                  No registration data available.
                </div>
              )}

            </div>

          </div>

        </div>

        {/* =====================================
            PASS FAIL + SCORE
        ====================================== */}

        <div className="analytics-middle-grid">

          {/* PASS FAIL */}

          <div className="analytics-chart-card analytics-doughnut-card">

            <div className="analytics-chart-header">

              <div>
                <h2>Pass / Fail Ratio</h2>

                <p>
                  Overall student performance.
                </p>
              </div>

              <FaTrophy />

            </div>

            <div className="analytics-doughnut-wrapper">

              {overview.totalAttempts > 0 ? (
                <Doughnut
                  data={passFailChartData}
                  options={doughnutOptions}
                />
              ) : (
                <div className="analytics-no-data">
                  No completed attempts yet.
                </div>
              )}

            </div>

            <div className="analytics-pass-fail-summary">

              <div>
                <span className="analytics-summary-dot passed"></span>

                <span>Passed</span>

                <strong>
                  {passFailRatio.passed || 0}
                </strong>
              </div>

              <div>
                <span className="analytics-summary-dot failed"></span>

                <span>Failed</span>

                <strong>
                  {passFailRatio.failed || 0}
                </strong>
              </div>

            </div>

          </div>

          {/* SCORE SUMMARY */}

          <div className="analytics-score-card">

            <div className="analytics-chart-header">

              <div>
                <h2>Score Overview</h2>

                <p>
                  Overall score statistics.
                </p>
              </div>

              <FaChartLine />

            </div>

            <div className="analytics-score-list">

              <div className="analytics-score-row">
                <span>Average Score</span>

                <strong>
                  {overview.averageScore || 0}%
                </strong>
              </div>

              <div className="analytics-score-row">
                <span>Pass Rate</span>

                <strong>
                  {overview.passRate || 0}%
                </strong>
              </div>

              <div className="analytics-score-row">
                <span>Fail Rate</span>

                <strong>
                  {overview.failRate || 0}%
                </strong>
              </div>

              <div className="analytics-score-row">
                <span>Passed Attempts</span>

                <strong>
                  {overview.passedAttempts || 0}
                </strong>
              </div>

              <div className="analytics-score-row">
                <span>Failed Attempts</span>

                <strong>
                  {overview.failedAttempts || 0}
                </strong>
              </div>

              <div className="analytics-score-row">
                <span>Active Students</span>

                <strong>
                  {overview.activeStudents || 0}
                </strong>
              </div>

              <div className="analytics-score-row">
                <span>Inactive Students</span>

                <strong>
                  {overview.inactiveStudents || 0}
                </strong>
              </div>

            </div>

          </div>

        </div>

        {/* =====================================
            POPULAR QUIZZES
        ====================================== */}

        <div className="analytics-chart-card">

          <div className="analytics-chart-header">

            <div>
              <h2>Popular Quizzes</h2>

              <p>
                Quizzes with the highest number
                of completed attempts.
              </p>
            </div>

            <FaTrophy />

          </div>

          <div className="analytics-large-chart-wrapper">

            {popularQuizzes.length > 0 ? (
              <Bar
                data={popularQuizChartData}
                options={horizontalBarOptions}
              />
            ) : (
              <div className="analytics-no-data">
                No quiz attempt data available.
              </div>
            )}

          </div>

        </div>

        {/* =====================================
            CATEGORIES + DIFFICULTY
        ====================================== */}

        <div className="analytics-chart-grid">

          {/* POPULAR CATEGORIES */}

          <div className="analytics-chart-card">

            <div className="analytics-chart-header">

              <div>
                <h2>Popular Categories</h2>

                <p>
                  Categories based on quiz attempts.
                </p>
              </div>

              <FaBook />

            </div>

            <div className="analytics-chart-wrapper">

              {popularCategories.length > 0 ? (
                <Bar
                  data={categoryChartData}
                  options={barChartOptions}
                />
              ) : (
                <div className="analytics-no-data">
                  No category data available.
                </div>
              )}

            </div>

          </div>

          {/* DIFFICULTY */}

          <div className="analytics-chart-card">

            <div className="analytics-chart-header">

              <div>
                <h2>Quiz Difficulty</h2>

                <p>
                  Distribution of available quizzes.
                </p>
              </div>

              <FaChartLine />

            </div>

            <div className="analytics-chart-wrapper">

              {difficultyStats.length > 0 ? (
                <Bar
                  data={difficultyChartData}
                  options={barChartOptions}
                />
              ) : (
                <div className="analytics-no-data">
                  No difficulty data available.
                </div>
              )}

            </div>

          </div>

        </div>

        {/* =====================================
            POPULAR QUIZ TABLE
        ====================================== */}

        <div className="analytics-table-card">

          <div className="analytics-chart-header">

            <div>
              <h2>Quiz Performance</h2>

              <p>
                Popular quizzes with their average
                scores.
              </p>
            </div>

            <FaClipboardList />

          </div>

          {popularQuizzes.length === 0 ? (
            <div className="analytics-no-table-data">
              No quiz performance data available.
            </div>
          ) : (
            <div className="analytics-table-wrapper">

              <table className="analytics-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Quiz</th>
                    <th>Category</th>
                    <th>Attempts</th>
                    <th>Average Score</th>
                  </tr>
                </thead>

                <tbody>

                  {popularQuizzes.map(
                    (quiz, index) => (
                      <tr key={quiz._id || index}>

                        <td>
                          <span className="analytics-rank">
                            {index + 1}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {quiz.title ||
                              "Unknown Quiz"}
                          </strong>
                        </td>

                        <td>
                          {quiz.category ||
                            "Unknown"}
                        </td>

                        <td>
                          {quiz.attempts || 0}
                        </td>

                        <td>
                          <span className="analytics-score-badge">
                            {quiz.averageScore || 0}%
                          </span>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default AdminAnalytics;