import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaSave,
  FaClipboardList,
} from "react-icons/fa";

import API from "../services/api";
import "./AdminQuiz.css";

function AdminQuiz() {
  const navigate = useNavigate();

  // =====================================================
  // QUIZ STATE
  // =====================================================

  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    category: "JavaScript",
    difficulty: "Beginner",
    duration: 20,
    isPublished: true,
  });

  // =====================================================
  // QUESTIONS STATE
  // =====================================================

  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 1,
    },
  ]);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // =====================================================
  // QUIZ DETAILS CHANGE
  // =====================================================

  const handleQuizChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setQuiz((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =====================================================
  // QUESTION CHANGE
  // =====================================================

  const handleQuestionChange = (
    index,
    value
  ) => {
    setQuestions((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              question: value,
            }
          : item
      )
    );
  };

  // =====================================================
  // OPTION CHANGE
  // =====================================================

  const handleOptionChange = (
    questionIndex,
    optionIndex,
    value
  ) => {
    setQuestions((prev) =>
      prev.map((item, i) => {
        if (i !== questionIndex) {
          return item;
        }

        const updatedOptions = [
          ...item.options,
        ];

        updatedOptions[optionIndex] = value;

        return {
          ...item,
          options: updatedOptions,
        };
      })
    );
  };

  // =====================================================
  // CORRECT ANSWER CHANGE
  // =====================================================

  const handleCorrectAnswerChange = (
    index,
    value
  ) => {
    setQuestions((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              correctAnswer:
                Number(value),
            }
          : item
      )
    );
  };

  // =====================================================
  // POINTS CHANGE
  // =====================================================

  const handlePointsChange = (
    index,
    value
  ) => {
    setQuestions((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              points:
                Number(value) || 1,
            }
          : item
      )
    );
  };

  // =====================================================
  // ADD QUESTION
  // =====================================================

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        points: 1,
      },
    ]);
  };

  // =====================================================
  // REMOVE QUESTION
  // =====================================================

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      setMessage({
        type: "error",
        text: "At least one question is required.",
      });

      return;
    }

    setQuestions((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    if (!quiz.title.trim()) {
      return "Please enter quiz title.";
    }

    if (!quiz.description.trim()) {
      return "Please enter quiz description.";
    }

    if (
      !quiz.duration ||
      Number(quiz.duration) <= 0
    ) {
      return "Please enter a valid duration.";
    }

    if (questions.length === 0) {
      return "Please add at least one question.";
    }

    for (
      let i = 0;
      i < questions.length;
      i++
    ) {
      const item = questions[i];

      if (!item.question.trim()) {
        return `Please enter Question ${
          i + 1
        }.`;
      }

      if (
        item.options.some(
          (option) =>
            !option.trim()
        )
      ) {
        return `Please fill all options for Question ${
          i + 1
        }.`;
      }

      if (
        item.correctAnswer < 0 ||
        item.correctAnswer > 3
      ) {
        return `Please select correct answer for Question ${
          i + 1
        }.`;
      }

      if (
        !item.points ||
        Number(item.points) < 1
      ) {
        return `Please enter valid points for Question ${
          i + 1
        }.`;
      }
    }

    return "";
  };

  // =====================================================
  // CREATE QUIZ
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    const validationError =
      validateForm();

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setLoading(true);

    try {
      // =================================================
      // IMPORTANT FIX
      //
      // Backend expects:
      // correctAnswer = actual option text
      //
      // Example:
      // ["var", "let", "const", "static"]
      //
      // correctAnswer: "const"
      // =================================================

      const formattedQuestions =
        questions.map((item) => {
          const correctAnswerText =
            item.options[
              Number(item.correctAnswer)
            ].trim();

          return {
            question:
              item.question.trim(),

            options:
              item.options.map(
                (option) =>
                  option.trim()
              ),

            correctAnswer:
              correctAnswerText,

            points:
              Number(item.points) || 1,
          };
        });

      // =================================================
      // IMPORTANT FIX
      //
      // Backend expects isPublished
      // NOT published
      // =================================================

      const payload = {
        title:
          quiz.title.trim(),

        description:
          quiz.description.trim(),

        category:
          quiz.category,

        difficulty:
          quiz.difficulty,

        duration:
          Number(quiz.duration),

        questions:
          formattedQuestions,

        isPublished:
          Boolean(
            quiz.isPublished
          ),
      };

      console.log(
        "================================="
      );

      console.log(
        "📤 CREATE QUIZ PAYLOAD"
      );

      console.log(
        payload
      );

      console.log(
        "================================="
      );

      const response =
        await API.post(
          "/quizzes",
          payload
        );

      console.log(
        "📥 CREATE QUIZ RESPONSE:",
        response.data
      );

      setMessage({
        type: "success",
        text:
          "Quiz created and published successfully!",
      });

      // =================================================
      // RESET FORM
      // =================================================

      setQuiz({
        title: "",
        description: "",
        category: "JavaScript",
        difficulty: "Beginner",
        duration: 20,
        isPublished: true,
      });

      setQuestions([
        {
          question: "",
          options: [
            "",
            "",
            "",
            "",
          ],
          correctAnswer: 0,
          points: 1,
        },
      ]);

      // =================================================
      // GO TO ALL QUIZZES
      // =================================================

      setTimeout(() => {
        navigate("/quizzes");
      }, 1000);
    } catch (error) {
      console.error(
        "Create Quiz Error:",
        error
      );

      console.error(
        "Backend Response:",
        error?.response?.data
      );

      setMessage({
        type: "error",
        text:
          error?.response?.data
            ?.message ||
          "Unable to create quiz. Please check your backend.",
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const handleCancel = () => {
    navigate("/dashboard");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="admin-quiz-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="admin-quiz-header">

        <button
          type="button"
          className="admin-back-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>

        <div>
          <span>
            QUIZMASTER ADMIN
          </span>

          <h1>
            Create New Quiz
          </h1>
        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="admin-quiz-container">

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message.text && (
          <div
            className={`admin-message ${message.type}`}
          >
            {message.text}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >

          {/* =================================================
              QUIZ INFORMATION
          ================================================= */}

          <section className="admin-card">

            <div className="admin-card-heading">

              <span>
                <FaClipboardList />
              </span>

              <div>
                <h2>
                  Quiz Information
                </h2>

                <p>
                  Add the basic details
                  of your quiz.
                </p>
              </div>

            </div>

            <div className="admin-form-grid">

              {/* TITLE */}

              <div className="admin-field full">

                <label htmlFor="title">
                  Quiz Title
                </label>

                <input
                  id="title"
                  type="text"
                  name="title"
                  value={
                    quiz.title
                  }
                  onChange={
                    handleQuizChange
                  }
                  placeholder="e.g. React Essentials"
                />

              </div>

              {/* DESCRIPTION */}

              <div className="admin-field full">

                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={
                    quiz.description
                  }
                  onChange={
                    handleQuizChange
                  }
                  placeholder="Write a short description about this quiz..."
                />

              </div>

              {/* CATEGORY */}

              <div className="admin-field">

                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={
                    quiz.category
                  }
                  onChange={
                    handleQuizChange
                  }
                >

                  <option value="JavaScript">
                    JavaScript
                  </option>

                  <option value="React">
                    React
                  </option>

                  <option value="Web Development">
                    Web Development
                  </option>

                  <option value="HTML">
                    HTML
                  </option>

                  <option value="CSS">
                    CSS
                  </option>

                  <option value="Programming">
                    Programming
                  </option>

                </select>

              </div>

              {/* DIFFICULTY */}

              <div className="admin-field">

                <label htmlFor="difficulty">
                  Difficulty
                </label>

                <select
                  id="difficulty"
                  name="difficulty"
                  value={
                    quiz.difficulty
                  }
                  onChange={
                    handleQuizChange
                  }
                >

                  <option value="Beginner">
                    Beginner
                  </option>

                  <option value="Intermediate">
                    Intermediate
                  </option>

                  <option value="Advanced">
                    Advanced
                  </option>

                </select>

              </div>

              {/* DURATION */}

              <div className="admin-field">

                <label htmlFor="duration">
                  Duration (minutes)
                </label>

                <input
                  id="duration"
                  type="number"
                  name="duration"
                  min="1"
                  value={
                    quiz.duration
                  }
                  onChange={
                    handleQuizChange
                  }
                />

              </div>

              {/* PUBLISH */}

              <div className="admin-field publish-field">

                <label className="publish-label">

                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={
                      quiz.isPublished
                    }
                    onChange={
                      handleQuizChange
                    }
                  />

                  Publish quiz immediately

                </label>

              </div>

            </div>

          </section>

          {/* =================================================
              QUESTIONS
          ================================================= */}

          <section className="admin-card">

            <div className="admin-card-heading question-heading">

              <div>
                <span>
                  <FaClipboardList />
                </span>
              </div>

              <div>
                <h2>
                  Quiz Questions
                </h2>

                <p>
                  Add questions and select
                  the correct answer.
                </p>
              </div>

              <span className="question-count">
                {questions.length}{" "}
                Questions
              </span>

            </div>

            <div className="questions-wrapper">

              {questions.map(
                (
                  item,
                  questionIndex
                ) => (

                  <div
                    className="admin-question-card"
                    key={
                      questionIndex
                    }
                  >

                    {/* QUESTION TOP */}

                    <div className="question-card-top">

                      <h3>
                        Question{" "}
                        {questionIndex +
                          1}
                      </h3>

                      {questions.length >
                        1 && (
                        <button
                          type="button"
                          className="remove-question"
                          onClick={() =>
                            removeQuestion(
                              questionIndex
                            )
                          }
                        >
                          <FaTrash />
                          Remove
                        </button>
                      )}

                    </div>

                    {/* QUESTION */}

                    <div className="admin-field">

                      <label>
                        Question
                      </label>

                      <textarea
                        value={
                          item.question
                        }
                        onChange={(e) =>
                          handleQuestionChange(
                            questionIndex,
                            e.target
                              .value
                          )
                        }
                        placeholder="Enter your question..."
                      />

                    </div>

                    {/* OPTIONS */}

                    <div className="options-grid">

                      {item.options.map(
                        (
                          option,
                          optionIndex
                        ) => {

                          const optionLetter =
                            String.fromCharCode(
                              65 +
                                optionIndex
                            );

                          return (
                            <div
                              className="admin-option"
                              key={
                                optionIndex
                              }
                            >

                              <span className="option-label">
                                {
                                  optionLetter
                                }
                              </span>

                              <input
                                type="text"
                                value={
                                  option
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleOptionChange(
                                    questionIndex,
                                    optionIndex,
                                    e.target
                                      .value
                                  )
                                }
                                placeholder={`Option ${optionLetter}`}
                              />

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* QUESTION SETTINGS */}

                    <div className="question-settings">

                      <div className="admin-field">

                        <label>
                          Correct Answer
                        </label>

                        <select
                          value={
                            item.correctAnswer
                          }
                          onChange={(e) =>
                            handleCorrectAnswerChange(
                              questionIndex,
                              e.target.value
                            )
                          }
                        >

                          <option value={0}>
                            A - Option A
                          </option>

                          <option value={1}>
                            B - Option B
                          </option>

                          <option value={2}>
                            C - Option C
                          </option>

                          <option value={3}>
                            D - Option D
                          </option>

                        </select>

                      </div>

                      <div className="admin-field">

                        <label>
                          Points
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            item.points
                          }
                          onChange={(e) =>
                            handlePointsChange(
                              questionIndex,
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>

            {/* ADD QUESTION */}

            <button
              type="button"
              className="add-question-btn"
              onClick={
                addQuestion
              }
            >
              <FaPlus />
              Add Another Question
            </button>

          </section>

          {/* =================================================
              SUBMIT
          ================================================= */}

          <div className="admin-submit-area">

            <button
              type="button"
              className="cancel-btn"
              onClick={
                handleCancel
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-quiz-btn"
              disabled={loading}
            >

              <FaSave />

              {loading
                ? "Creating Quiz..."
                : "Create Quiz"}

            </button>

          </div>

        </form>

      </main>

    </div>
  );
}

export default AdminQuiz;