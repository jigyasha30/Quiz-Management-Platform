import { useEffect, useState } from "react";
import {
  FaSearch,
  FaUser,
  FaEye,
  FaChartLine,
  FaHistory,
  FaUserCheck,
  FaUserTimes,
  FaTrash,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";
import API from "../services/api";
import "./AdminUsers.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userAttempts, setUserAttempts] = useState([]);

  const [showProfile, setShowProfile] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAttempts, setShowAttempts] = useState(false);

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
  // FETCH USERS
  // ==========================================

  const fetchUsers = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");

      const url = searchValue.trim()
        ? `/users?search=${encodeURIComponent(searchValue.trim())}`
        : "/users";

      const response = await API.get(url, getConfig());

      if (response.data?.success) {
        setUsers(response.data.users || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Fetch Users Error:", err);

      setError(
        err.response?.data?.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = () => {
    fetchUsers(search);
  };

  // ==========================================
  // CLEAR SEARCH & FILTERS
  // ==========================================

  const handleClearSearch = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");

    fetchUsers("");
  };

  // ==========================================
  // FILTER USERS
  // ==========================================

  const filteredUsers = users.filter((user) => {
    const roleMatch =
      roleFilter === "all" ||
      user.role?.toLowerCase() === roleFilter;

    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive === true) ||
      (statusFilter === "inactive" && user.isActive === false);

    return roleMatch && statusMatch;
  });

  // ==========================================
  // VIEW PROFILE
  // ==========================================

  const handleViewProfile = async (user) => {
    try {
      setActionLoading(true);
      setError("");

      const response = await API.get(
        `/users/${user._id}`,
        getConfig()
      );

      if (response.data?.success) {
        setSelectedUser(response.data.user);
        setShowProfile(true);
        setShowStats(false);
        setShowAttempts(false);
      }
    } catch (err) {
      console.error("Get User Profile Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load user profile"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // VIEW STATS
  // ==========================================

  const handleViewStats = async (user) => {
    try {
      setActionLoading(true);
      setError("");

      const response = await API.get(
        `/users/${user._id}/stats`,
        getConfig()
      );

      if (response.data?.success) {
        setSelectedUser(user);
        setUserStats(response.data.stats);

        setShowStats(true);
        setShowProfile(false);
        setShowAttempts(false);
      }
    } catch (err) {
      console.error("Get User Stats Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load user statistics"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // VIEW ATTEMPTS
  // ==========================================

  const handleViewAttempts = async (user) => {
    try {
      setActionLoading(true);
      setError("");

      const response = await API.get(
        `/users/${user._id}/attempts`,
        getConfig()
      );

      if (response.data?.success) {
        setSelectedUser(user);

        setUserAttempts(response.data.attempts || []);

        setShowAttempts(true);
        setShowProfile(false);
        setShowStats(false);
      }
    } catch (err) {
      console.error("Get User Attempts Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load attempt history"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // ACTIVATE / DEACTIVATE
  // ==========================================

  const handleStatusChange = async (user) => {
    const nextStatus = !user.isActive;

    const actionText = nextStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response = await API.put(
        `/users/${user._id}/status`,
        {
          isActive: nextStatus,
        },
        getConfig()
      );

      if (response.data?.success) {
        setUsers((prevUsers) =>
          prevUsers.map((item) =>
            item._id === user._id
              ? {
                  ...item,
                  isActive: nextStatus,
                }
              : item
          )
        );

        if (
          selectedUser &&
          selectedUser._id === user._id
        ) {
          setSelectedUser((prev) => ({
            ...prev,
            isActive: nextStatus,
          }));
        }
      }
    } catch (err) {
      console.error("Update User Status Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update user status"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // DELETE USER
  // ==========================================

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response = await API.delete(
        `/users/${user._id}`,
        getConfig()
      );

      if (response.data?.success) {
        setUsers((prevUsers) =>
          prevUsers.filter(
            (item) => item._id !== user._id
          )
        );

        if (
          selectedUser &&
          selectedUser._id === user._id
        ) {
          closeDetails();
        }
      }
    } catch (err) {
      console.error("Delete User Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete user"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // CLOSE DETAILS
  // ==========================================

  const closeDetails = () => {
    setSelectedUser(null);
    setUserStats(null);
    setUserAttempts([]);

    setShowProfile(false);
    setShowStats(false);
    setShowAttempts(false);
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (seconds) => {
    const safeSeconds = Number(seconds) || 0;

    const minutes = Math.floor(
      safeSeconds / 60
    );

    const remainingSeconds = safeSeconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="admin-users-page">
      <div className="admin-users-container">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="admin-users-header">
          <div>
            <p className="admin-users-label">
              ADMIN TOOLS
            </p>

            <h1>User Management</h1>

            <p className="admin-users-subtitle">
              Manage students, view performance,
              and control account access.
            </p>
          </div>

          <div className="admin-users-count">
            <FaUser />

            <div>
              <strong>{filteredUsers.length}</strong>
              <span>Users</span>
            </div>
          </div>
        </div>

        {/* =====================================
            ERROR
        ====================================== */}

        {error && (
          <div className="admin-users-error">
            {error}

            <button
              type="button"
              onClick={() => setError("")}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* =====================================
            SEARCH & FILTERS
        ====================================== */}

        <div className="admin-users-toolbar">

          {/* SEARCH INPUT */}

          <div className="admin-users-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>

          {/* ROLE FILTER */}

          <select
            className="admin-users-filter"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
          >
            <option value="all">
              All Roles
            </option>

            <option value="student">
              Students
            </option>

            <option value="admin">
              Admins
            </option>
          </select>

          {/* STATUS FILTER */}

          <select
            className="admin-users-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          {/* SEARCH BUTTON */}

          <button
            type="button"
            className="admin-search-button"
            onClick={handleSearch}
          >
            <FaSearch />
            Search
          </button>

          {/* CLEAR BUTTON */}

          <button
            type="button"
            className="admin-clear-button"
            onClick={handleClearSearch}
          >
            <FaTimes />
            Clear
          </button>

        </div>

        {/* =====================================
            USERS TABLE
        ====================================== */}

        <div className="admin-users-card">

          <div className="admin-users-card-header">
            <div>
              <h2>Students</h2>

              <p>
                View and manage registered users.
              </p>
            </div>

            <span>
              {filteredUsers.length} result
              {filteredUsers.length !== 1
                ? "s"
                : ""}
            </span>
          </div>

          {loading ? (
            <div className="admin-users-loading">
              <div className="admin-users-spinner"></div>

              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-users-empty">
              <FaUser />

              <h3>
                {search ||
                roleFilter !== "all" ||
                statusFilter !== "all"
                  ? "No users found"
                  : "No users available"}
              </h3>

              <p>
                {search ||
                roleFilter !== "all" ||
                statusFilter !== "all"
                  ? "Try changing your search or filters."
                  : "Registered users will appear here."}
              </p>
            </div>
          ) : (
            <div className="admin-users-table-wrapper">

              <table className="admin-users-table">

                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredUsers.map((user) => (

                    <tr key={user._id}>

                      {/* STUDENT */}

                      <td>
                        <div className="admin-user-info">

                          <div className="admin-user-avatar">
                            {user.name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </div>

                          <div>
                            <strong>
                              {user.name}
                            </strong>

                            <span>
                              {user.email}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* ROLE */}

                      <td>
                        <span
                          className={`admin-role-badge ${
                            user.role === "admin"
                              ? "admin-role"
                              : "student-role"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`admin-status-badge ${
                            user.isActive
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          <span className="status-dot"></span>

                          {user.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* JOINED */}

                      <td>
                        <span className="admin-joined-date">
                          {formatDate(
                            user.createdAt
                          )}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="admin-user-actions">

                          {/* VIEW */}

                          <button
                            type="button"
                            className="action-view"
                            title="View profile"
                            onClick={() =>
                              handleViewProfile(user)
                            }
                            disabled={actionLoading}
                          >
                            <FaEye />
                          </button>

                          {/* STATS */}

                          <button
                            type="button"
                            className="action-stats"
                            title="View performance"
                            onClick={() =>
                              handleViewStats(user)
                            }
                            disabled={actionLoading}
                          >
                            <FaChartLine />
                          </button>

                          {/* HISTORY */}

                          <button
                            type="button"
                            className="action-history"
                            title="View attempts"
                            onClick={() =>
                              handleViewAttempts(user)
                            }
                            disabled={actionLoading}
                          >
                            <FaHistory />
                          </button>

                          {/* ACTIVATE / DEACTIVATE */}

                          <button
                            type="button"
                            className={
                              user.isActive
                                ? "action-deactivate"
                                : "action-activate"
                            }
                            title={
                              user.isActive
                                ? "Deactivate user"
                                : "Activate user"
                            }
                            onClick={() =>
                              handleStatusChange(user)
                            }
                            disabled={actionLoading}
                          >
                            {user.isActive ? (
                              <FaUserTimes />
                            ) : (
                              <FaUserCheck />
                            )}
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            className="action-delete"
                            title="Delete user"
                            onClick={() =>
                              handleDeleteUser(user)
                            }
                            disabled={actionLoading}
                          >
                            <FaTrash />
                          </button>

                        </div>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* =====================================
            PROFILE MODAL
        ====================================== */}

        {showProfile && selectedUser && (
          <div
            className="admin-modal-overlay"
            onClick={closeDetails}
          >
            <div
              className="admin-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="admin-modal-header">

                <div>
                  <p>STUDENT PROFILE</p>

                  <h2>
                    {selectedUser.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                >
                  <FaTimes />
                </button>

              </div>

              <div className="admin-profile-content">

                <div className="admin-profile-avatar">
                  {selectedUser.name
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>

                <div className="admin-profile-details">

                  <div>
                    <span>Name</span>

                    <strong>
                      {selectedUser.name}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>

                    <strong>
                      {selectedUser.email}
                    </strong>
                  </div>

                  <div>
                    <span>Role</span>

                    <strong>
                      {selectedUser.role}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong
                      className={
                        selectedUser.isActive
                          ? "profile-active"
                          : "profile-inactive"
                      }
                    >
                      {selectedUser.isActive
                        ? "Active"
                        : "Inactive"}
                    </strong>
                  </div>

                  <div>
                    <span>Joined</span>

                    <strong>
                      {formatDate(
                        selectedUser.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Last Updated</span>

                    <strong>
                      {formatDate(
                        selectedUser.updatedAt
                      )}
                    </strong>
                  </div>

                </div>

              </div>

              <div className="admin-modal-actions">

                <button
                  type="button"
                  onClick={() =>
                    handleViewStats(selectedUser)
                  }
                >
                  <FaChartLine />
                  Performance
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleViewAttempts(
                      selectedUser
                    )
                  }
                >
                  <FaHistory />
                  Attempt History
                </button>

              </div>

            </div>
          </div>
        )}

        {/* =====================================
            STATS MODAL
        ====================================== */}

        {showStats &&
          selectedUser &&
          userStats && (
            <div
              className="admin-modal-overlay"
              onClick={closeDetails}
            >
              <div
                className="admin-modal admin-stats-modal"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <div className="admin-modal-header">

                  <div>
                    <p>PERFORMANCE</p>

                    <h2>
                      {selectedUser.name}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeDetails}
                  >
                    <FaTimes />
                  </button>

                </div>

                <div className="admin-stats-grid">

                  <div className="admin-stat-box">
                    <span>Attempts</span>

                    <strong>
                      {userStats.totalAttempts}
                    </strong>
                  </div>

                  <div className="admin-stat-box">
                    <span>Average Score</span>

                    <strong>
                      {userStats.averagePercentage}%
                    </strong>
                  </div>

                  <div className="admin-stat-box">
                    <span>Best Score</span>

                    <strong>
                      {userStats.bestPercentage}%
                    </strong>
                  </div>

                  <div className="admin-stat-box">
                    <span>Passed</span>

                    <strong>
                      {userStats.passedAttempts}
                    </strong>
                  </div>

                  <div className="admin-stat-box">
                    <span>Needs Practice</span>

                    <strong>
                      {userStats.failedAttempts}
                    </strong>
                  </div>

                  <div className="admin-stat-box">
                    <span>Total Score</span>

                    <strong>
                      {userStats.totalScore}
                    </strong>
                  </div>

                </div>

                <div className="admin-modal-actions">

                  <button
                    type="button"
                    onClick={() =>
                      handleViewAttempts(
                        selectedUser
                      )
                    }
                  >
                    <FaHistory />
                    View Attempts
                  </button>

                </div>

              </div>
            </div>
          )}

        {/* =====================================
            ATTEMPTS MODAL
        ====================================== */}

        {showAttempts && selectedUser && (
          <div
            className="admin-modal-overlay"
            onClick={closeDetails}
          >
            <div
              className="admin-modal admin-attempts-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="admin-modal-header">

                <div>
                  <p>ATTEMPT HISTORY</p>

                  <h2>
                    {selectedUser.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                >
                  <FaTimes />
                </button>

              </div>

              {userAttempts.length === 0 ? (
                <div className="admin-attempts-empty">

                  <FaHistory />

                  <h3>
                    No attempts yet
                  </h3>

                  <p>
                    This student has not
                    completed any quizzes.
                  </p>

                </div>
              ) : (
                <div className="admin-attempts-list">

                  {userAttempts.map(
                    (attempt) => (
                      <div
                        className="admin-attempt-item"
                        key={attempt._id}
                      >

                        <div>
                          <h3>
                            {attempt.quiz?.title ||
                              "Quiz"}
                          </h3>

                          <p>
                            Attempt #
                            {attempt.attemptNumber ||
                              1}
                            {" • "}
                            {formatDate(
                              attempt.createdAt
                            )}
                          </p>
                        </div>

                        <div className="admin-attempt-score">

                          <strong>
                            {attempt.percentage ||
                              0}
                            %
                          </strong>

                          <span>
                            {attempt.score || 0}/
                            {attempt.totalPoints ||
                              0}
                          </span>

                        </div>

                        <div className="admin-attempt-meta">

                          <span>
                            ✓{" "}
                            {
                              attempt.correctAnswers
                            }
                          </span>

                          <span>
                            ✕{" "}
                            {
                              attempt.wrongAnswers
                            }
                          </span>

                          <span>
                            —{" "}
                            {
                              attempt.unanswered
                            }
                          </span>

                          <span>
                            {formatTime(
                              attempt.timeTaken
                            )}
                          </span>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

              <button
                type="button"
                className="admin-back-button"
                onClick={closeDetails}
              >
                <FaArrowLeft />
                Close
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminUsers;