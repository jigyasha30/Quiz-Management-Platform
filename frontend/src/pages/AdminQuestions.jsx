import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTrash,
  FaTimes,
  FaCheckCircle,
  FaQuestionCircle,
  FaFolder,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AdminQuestions.css";

function AdminQuestions() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [marks, setMarks] = useState(1);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");

  const [editingQuestion, setEditingQuestion] = useState(null);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // TOKEN
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
  // FETCH QUESTIONS
  // ==========================================

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        "/questions",
        getConfig()
      );

      if (response.data?.success) {
        setQuestions(response.data.questions || []);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Fetch Questions Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load questions"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH CATEGORIES
  // ==========================================

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);

      const response = await API.get(
        "/categories",
        getConfig()
      );

      if (response.data?.success) {
        setCategories(response.data.categories || []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Fetch Categories Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load categories"
      );
    } finally {
      setCategoryLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, []);

  // ==========================================
  // CLEAR MESSAGES
  // ==========================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setCategory("");
    setDifficulty("medium");
    setMarks(1);
    setEditingQuestion(null);
  };

  // ==========================================
  // HANDLE OPTION CHANGE
  // ==========================================

  const handleOptionChange = (index, value) => {
    setOptions((prev) =>
      prev.map((option, optionIndex) =>
        optionIndex === index ? value : option
      )
    );
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    const trimmedQuestion = questionText.trim();

    if (!trimmedQuestion) {
      setError("Question text is required.");
      return false;
    }

    if (trimmedQuestion.length < 5) {
      setError(
        "Question must be at least 5 characters."
      );
      return false;
    }

    const cleanedOptions = options.map((option) =>
      option.trim()
    );

    if (cleanedOptions.some((option) => !option)) {
      setError("All four options are required.");
      return false;
    }

    if (new Set(cleanedOptions.map((item) => item.toLowerCase())).size !== 4) {
      setError("All options must be different.");
      return false;
    }

    if (!correctAnswer.trim()) {
      setError("Please select the correct answer.");
      return false;
    }

    if (!category) {
      setError("Please select a category.");
      return false;
    }

    if (!marks || Number(marks) < 1) {
      setError("Marks must be at least 1.");
      return false;
    }

    return true;
  };

  // ==========================================
  // CREATE QUESTION
  // ==========================================

  const handleCreateQuestion = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!validateForm()) {
      return;
    }

    try {
      setActionLoading(true);

      const cleanedOptions = options.map((option) =>
        option.trim()
      );

      const response = await API.post(
        "/questions",
        {
          questionText: questionText.trim(),
          options: cleanedOptions,
          correctAnswer: correctAnswer.trim(),
          category,
          difficulty,
          marks: Number(marks),
        },
        getConfig()
      );

      if (response.data?.success) {
        setQuestions((prev) => [
          response.data.question,
          ...prev,
        ]);

        setSuccess(
          "Question created successfully."
        );

        resetForm();
      }
    } catch (err) {
      console.error(
        "Create Question Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create question"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // START EDIT
  // ==========================================

  const handleEditQuestion = (question) => {
    clearMessages();

    setEditingQuestion(question);

    setQuestionText(
      question.questionText ||
        question.question ||
        ""
    );

    setOptions(
      Array.isArray(question.options)
        ? question.options.map((option) =>
            typeof option === "object"
              ? option.text || option.label || ""
              : option
          )
        : ["", "", "", ""]
    );

    setCorrectAnswer(
      typeof question.correctAnswer === "object"
        ? question.correctAnswer.text ||
            question.correctAnswer.label ||
            ""
        : question.correctAnswer || ""
    );

    setCategory(
      question.category?._id ||
        question.category ||
        ""
    );

    setDifficulty(
      question.difficulty || "medium"
    );

    setMarks(
      question.marks ||
        question.points ||
        1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // UPDATE QUESTION
  // ==========================================

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!editingQuestion) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setActionLoading(true);

      const cleanedOptions = options.map((option) =>
        option.trim()
      );

      const response = await API.put(
        `/questions/${editingQuestion._id}`,
        {
          questionText: questionText.trim(),
          options: cleanedOptions,
          correctAnswer: correctAnswer.trim(),
          category,
          difficulty,
          marks: Number(marks),
        },
        getConfig()
      );

      if (response.data?.success) {
        setQuestions((prev) =>
          prev.map((question) =>
            question._id === editingQuestion._id
              ? response.data.question
              : question
          )
        );

        setSuccess(
          "Question updated successfully."
        );

        resetForm();
      }
    } catch (err) {
      console.error(
        "Update Question Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update question"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // DELETE QUESTION
  // ==========================================

  const handleDeleteQuestion = async (question) => {
    const text =
      question.questionText ||
      question.question ||
      "this question";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${text}"?`
    );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      setActionLoading(true);

      const response = await API.delete(
        `/questions/${question._id}`,
        getConfig()
      );

      if (response.data?.success) {
        setQuestions((prev) =>
          prev.filter(
            (item) =>
              item._id !== question._id
          )
        );

        if (
          editingQuestion?._id ===
          question._id
        ) {
          resetForm();
        }

        setSuccess(
          "Question deleted successfully."
        );
      }
    } catch (err) {
      console.error(
        "Delete Question Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete question"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    clearMessages();
    resetForm();
  };

  // ==========================================
  // GET CATEGORY NAME
  // ==========================================

  const getCategoryName = (question) => {
    if (question.category?.name) {
      return question.category.name;
    }

    if (typeof question.category === "string") {
      const foundCategory = categories.find(
        (item) =>
          item._id === question.category
      );

      return foundCategory?.name || "Unknown";
    }

    return "Unknown";
  };

  // ==========================================
  // FILTER QUESTIONS
  // ==========================================

  const filteredQuestions = questions.filter(
    (question) => {
      const searchValue =
        search.toLowerCase().trim();

      const questionTextValue =
        (
          question.questionText ||
          question.question ||
          ""
        ).toLowerCase();

      const categoryName =
        getCategoryName(question).toLowerCase();

      const matchesSearch =
        !searchValue ||
        questionTextValue.includes(
          searchValue
        ) ||
        categoryName.includes(searchValue);

      const questionCategory =
        question.category?._id ||
        question.category ||
        "";

      const matchesCategory =
        !categoryFilter ||
        questionCategory === categoryFilter;

      const matchesDifficulty =
        !difficultyFilter ||
        question.difficulty === difficultyFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty
      );
    }
  );

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
  // DIFFICULTY CLASS
  // ==========================================

  const getDifficultyClass = (difficulty) => {
    if (difficulty === "easy") {
      return "easy";
    }

    if (difficulty === "hard") {
      return "hard";
    }

    return "medium";
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="admin-questions-page">
      <div className="admin-questions-container">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="admin-questions-header">
          <div>
            <button
              type="button"
              className="admin-question-back-btn"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              <FaArrowLeft />
              Back to Dashboard
            </button>

            <p className="admin-question-label">
              ADMIN TOOLS
            </p>

            <h1>
              Question Management
            </h1>

            <p className="admin-question-subtitle">
              Create, edit, search, and manage
              quiz questions.
            </p>
          </div>

          <div className="admin-question-count">
            <FaQuestionCircle />

            <div>
              <strong>
                {questions.length}
              </strong>

              <span>
                Questions
              </span>
            </div>
          </div>
        </div>

        {/* ======================================
            MESSAGES
        ====================================== */}

        {error && (
          <div className="admin-question-message error">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <FaTimes />
            </button>
          </div>
        )}

        {success && (
          <div className="admin-question-message success">
            <span>
              <FaCheckCircle />
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* ======================================
            CREATE / EDIT FORM
        ====================================== */}

        <div className="admin-question-form-card">

          <div className="admin-question-form-heading">
            <div className="admin-question-form-icon">
              {editingQuestion ? (
                <FaEdit />
              ) : (
                <FaPlus />
              )}
            </div>

            <div>
              <h2>
                {editingQuestion
                  ? "Edit Question"
                  : "Create Question"}
              </h2>

              <p>
                {editingQuestion
                  ? "Update the selected question."
                  : "Add a new question to your question bank."}
              </p>
            </div>
          </div>

          <form
            onSubmit={
              editingQuestion
                ? handleUpdateQuestion
                : handleCreateQuestion
            }
            className="admin-question-form"
          >

            {/* QUESTION */}

            <div className="admin-question-field full-width">
              <label htmlFor="questionText">
                Question
              </label>

              <textarea
                id="questionText"
                placeholder="Enter your question..."
                value={questionText}
                onChange={(e) =>
                  setQuestionText(
                    e.target.value
                  )
                }
                rows="4"
                maxLength={1000}
                disabled={actionLoading}
              />
            </div>

            {/* OPTIONS */}

            <div className="admin-question-options-section">
              <div className="admin-question-section-title">
                <h3>Answer Options</h3>
                <span>
                  Select the correct answer
                </span>
              </div>

              <div className="admin-question-options-grid">
                {options.map(
                  (option, index) => (
                    <div
                      className={`admin-question-option ${
                        correctAnswer ===
                        option.trim() &&
                        option.trim()
                          ? "selected"
                          : ""
                      }`}
                      key={index}
                    >
                      <div className="admin-question-option-header">
                        <span>
                          Option{" "}
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={
                            correctAnswer ===
                            option.trim() &&
                            option.trim() !== ""
                          }
                          onChange={() =>
                            setCorrectAnswer(
                              option.trim()
                            )
                          }
                          disabled={
                            actionLoading ||
                            !option.trim()
                          }
                        />
                      </div>

                      <input
                        type="text"
                        placeholder={`Enter option ${String.fromCharCode(
                          65 + index
                        )}`}
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            e.target.value
                          )
                        }
                        maxLength={300}
                        disabled={actionLoading}
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* CATEGORY */}

            <div className="admin-question-field">
              <label htmlFor="questionCategory">
                Category
              </label>

              <div className="admin-question-select-wrapper">
                <FaFolder />

                <select
                  id="questionCategory"
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  disabled={
                    actionLoading ||
                    categoryLoading
                  }
                >
                  <option value="">
                    {categoryLoading
                      ? "Loading categories..."
                      : "Select Category"}
                  </option>

                  {categories
                    .filter(
                      (item) =>
                        item.isActive !== false
                    )
                    .map((item) => (
                      <option
                        key={item._id}
                        value={item._id}
                      >
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* DIFFICULTY */}

            <div className="admin-question-field">
              <label htmlFor="questionDifficulty">
                Difficulty
              </label>

              <select
                id="questionDifficulty"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value
                  )
                }
                disabled={actionLoading}
              >
                <option value="easy">
                  Easy
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="hard">
                  Hard
                </option>
              </select>
            </div>

            {/* MARKS */}

            <div className="admin-question-field">
              <label htmlFor="questionMarks">
                Marks
              </label>

              <input
                id="questionMarks"
                type="number"
                min="1"
                max="100"
                value={marks}
                onChange={(e) =>
                  setMarks(e.target.value)
                }
                disabled={actionLoading}
              />
            </div>

            {/* BUTTONS */}

            <div className="admin-question-form-actions">
              <button
                type="submit"
                className="admin-question-submit-btn"
                disabled={actionLoading}
              >
                {editingQuestion ? (
                  <>
                    <FaEdit />

                    {actionLoading
                      ? "Updating..."
                      : "Update Question"}
                  </>
                ) : (
                  <>
                    <FaPlus />

                    {actionLoading
                      ? "Creating..."
                      : "Create Question"}
                  </>
                )}
              </button>

              {editingQuestion && (
                <button
                  type="button"
                  className="admin-question-cancel-btn"
                  onClick={
                    handleCancelEdit
                  }
                  disabled={actionLoading}
                >
                  <FaTimes />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ======================================
            SEARCH / FILTER
        ====================================== */}

        <div className="admin-question-filter-card">

          <div className="admin-question-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                <FaTimes />
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
          >
            <option value="">
              All Categories
            </option>

            {categories.map((item) => (
              <option
                key={item._id}
                value={item._id}
              >
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) =>
              setDifficultyFilter(
                e.target.value
              )
            }
          >
            <option value="">
              All Difficulties
            </option>

            <option value="easy">
              Easy
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="hard">
              Hard
            </option>
          </select>

          <span className="admin-question-result-count">
            {filteredQuestions.length} result
            {filteredQuestions.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {/* ======================================
            QUESTION LIST
        ====================================== */}

        <div className="admin-question-list-card">

          <div className="admin-question-list-header">
            <div>
              <h2>
                Questions
              </h2>

              <p>
                Manage all questions in your
                question bank.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="admin-question-loading">
              <div className="admin-question-spinner"></div>

              <p>
                Loading questions...
              </p>
            </div>
          ) : filteredQuestions.length ===
            0 ? (
            <div className="admin-question-empty">
              <div className="admin-question-empty-icon">
                <FaQuestionCircle />
              </div>

              <h3>
                {search ||
                categoryFilter ||
                difficultyFilter
                  ? "No questions found"
                  : "No questions available"}
              </h3>

              <p>
                {search ||
                categoryFilter ||
                difficultyFilter
                  ? "Try changing your search or filters."
                  : "Create your first question above."}
              </p>
            </div>
          ) : (
            <div className="admin-question-grid">

              {filteredQuestions.map(
                (question, index) => {
                  const text =
                    question.questionText ||
                    question.question ||
                    "Untitled Question";

                  const questionOptions =
                    Array.isArray(
                      question.options
                    )
                      ? question.options
                      : [];

                  return (
                    <div
                      className="admin-question-item"
                      key={question._id}
                    >

                      {/* TOP */}

                      <div className="admin-question-item-top">

                        <div className="admin-question-number">
                          Q{index + 1}
                        </div>

                        <div className="admin-question-item-actions">

                          <button
                            type="button"
                            className="question-edit-btn"
                            title="Edit question"
                            onClick={() =>
                              handleEditQuestion(
                                question
                              )
                            }
                            disabled={
                              actionLoading
                            }
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="question-delete-btn"
                            title="Delete question"
                            onClick={() =>
                              handleDeleteQuestion(
                                question
                              )
                            }
                            disabled={
                              actionLoading
                            }
                          >
                            <FaTrash />
                          </button>

                        </div>
                      </div>

                      {/* QUESTION TEXT */}

                      <div className="admin-question-item-content">

                        <h3>
                          {text}
                        </h3>

                        {/* OPTIONS */}

                        <div className="admin-question-answer-list">

                          {questionOptions
                            .slice(0, 4)
                            .map(
                              (
                                option,
                                optionIndex
                              ) => {
                                const optionText =
                                  typeof option ===
                                  "object"
                                    ? option.text ||
                                      option.label ||
                                      ""
                                    : option;

                                const correctText =
                                  typeof question.correctAnswer ===
                                  "object"
                                    ? question
                                        .correctAnswer
                                        ?.text ||
                                      question
                                        .correctAnswer
                                        ?.label ||
                                      ""
                                    : question.correctAnswer ||
                                      "";

                                const isCorrect =
                                  optionText ===
                                  correctText;

                                return (
                                  <div
                                    className={`admin-question-answer ${
                                      isCorrect
                                        ? "correct"
                                        : ""
                                    }`}
                                    key={
                                      optionIndex
                                    }
                                  >
                                    <span className="admin-question-answer-letter">
                                      {String.fromCharCode(
                                        65 +
                                          optionIndex
                                      )}
                                    </span>

                                    <span>
                                      {optionText}
                                    </span>

                                    {isCorrect && (
                                      <FaCheckCircle />
                                    )}
                                  </div>
                                );
                              }
                            )}

                        </div>
                      </div>

                      {/* FOOTER */}

                      <div className="admin-question-item-footer">

                        <span className="admin-question-category">
                          <FaFolder />
                          {getCategoryName(
                            question
                          )}
                        </span>

                        <span
                          className={`admin-question-difficulty ${getDifficultyClass(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty ||
                            "Medium"}
                        </span>

                        <span className="admin-question-marks">
                          {question.marks ||
                            question.points ||
                            1}{" "}
                          mark
                          {(question.marks ||
                            question.points ||
                            1) !== 1
                            ? "s"
                            : ""}
                        </span>
                      </div>

                      <div className="admin-question-created">
                        Created{" "}
                        {formatDate(
                          question.createdAt
                        )}
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminQuestions;