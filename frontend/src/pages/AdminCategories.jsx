import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTrash,
  FaTimes,
  FaFolder,
  FaCheckCircle,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AdminCategories.css";

function AdminCategories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [search, setSearch] = useState("");

  const [editingCategory, setEditingCategory] = useState(null);

  const [loading, setLoading] = useState(true);
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
  // FETCH CATEGORIES
  // ==========================================

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

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
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
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
    setName("");
    setDescription("");
    setEditingCategory(null);
  };

  // ==========================================
  // CREATE CATEGORY
  // ==========================================

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    clearMessages();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setError(
        "Category name must be at least 2 characters."
      );
      return;
    }

    try {
      setActionLoading(true);

      const response = await API.post(
        "/categories",
        {
          name: trimmedName,
          description: trimmedDescription,
        },
        getConfig()
      );

      if (response.data?.success) {
        setCategories((prev) => [
          response.data.category,
          ...prev,
        ]);

        setSuccess(
          "Category created successfully."
        );

        resetForm();
      }
    } catch (err) {
      console.error(
        "Create Category Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create category"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // START EDIT
  // ==========================================

  const handleEditCategory = (category) => {
    clearMessages();

    setEditingCategory(category);

    setName(category.name || "");

    setDescription(
      category.description || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // UPDATE CATEGORY
  // ==========================================

  const handleUpdateCategory = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!editingCategory) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setError(
        "Category name must be at least 2 characters."
      );
      return;
    }

    try {
      setActionLoading(true);

      const response = await API.put(
        `/categories/${editingCategory._id}`,
        {
          name: trimmedName,
          description: trimmedDescription,
        },
        getConfig()
      );

      if (response.data?.success) {
        setCategories((prev) =>
          prev.map((category) =>
            category._id === editingCategory._id
              ? response.data.category
              : category
          )
        );

        setSuccess(
          "Category updated successfully."
        );

        resetForm();
      }
    } catch (err) {
      console.error(
        "Update Category Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update category"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // ACTIVATE / DEACTIVATE CATEGORY
  // ==========================================

  const handleToggleStatus = async (category) => {
    clearMessages();

    try {
      setActionLoading(true);

      const response = await API.put(
        `/categories/${category._id}/status`,
        {
          isActive: !category.isActive,
        },
        getConfig()
      );

      if (response.data?.success) {
        setCategories((prev) =>
          prev.map((item) =>
            item._id === category._id
              ? response.data.category
              : item
          )
        );

        setSuccess(
          response.data.message ||
            "Category status updated successfully."
        );
      }
    } catch (err) {
      console.error(
        "Update Category Status Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update category status"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // DELETE CATEGORY
  // ==========================================

  const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      setActionLoading(true);

      const response = await API.delete(
        `/categories/${category._id}`,
        getConfig()
      );

      if (response.data?.success) {
        setCategories((prev) =>
          prev.filter(
            (item) =>
              item._id !== category._id
          )
        );

        if (
          editingCategory?._id ===
          category._id
        ) {
          resetForm();
        }

        setSuccess(
          "Category deleted successfully."
        );
      }
    } catch (err) {
      console.error(
        "Delete Category Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete category"
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
  // FILTER
  // ==========================================

  const filteredCategories =
    categories.filter((category) => {
      const searchValue =
        search.toLowerCase().trim();

      if (!searchValue) {
        return true;
      }

      return (
        category.name
          ?.toLowerCase()
          .includes(searchValue) ||
        category.description
          ?.toLowerCase()
          .includes(searchValue)
      );
    });

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
  // RENDER
  // ==========================================

  return (
    <div className="admin-categories-page">
      <div className="admin-categories-container">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="admin-categories-header">
          <div>
            <button
              type="button"
              className="admin-category-back-btn"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              <FaArrowLeft />
              Back to Dashboard
            </button>

            <p className="admin-category-label">
              ADMIN TOOLS
            </p>

            <h1>
              Category Management
            </h1>

            <p className="admin-category-subtitle">
              Create, edit, search, and manage
              quiz categories.
            </p>
          </div>

          <div className="admin-category-count">
            <FaFolder />

            <div>
              <strong>
                {categories.length}
              </strong>

              <span>
                Categories
              </span>
            </div>
          </div>
        </div>

        {/* ======================================
            MESSAGES
        ====================================== */}

        {error && (
          <div className="admin-category-message error">
            <span>
              {error}
            </span>

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
          <div className="admin-category-message success">
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

        <div className="admin-category-form-card">

          <div className="admin-category-form-heading">
            <div className="admin-category-form-icon">
              {editingCategory ? (
                <FaEdit />
              ) : (
                <FaPlus />
              )}
            </div>

            <div>
              <h2>
                {editingCategory
                  ? "Edit Category"
                  : "Create Category"}
              </h2>

              <p>
                {editingCategory
                  ? "Update the selected quiz category."
                  : "Add a new category for your quizzes."}
              </p>
            </div>
          </div>

          <form
            onSubmit={
              editingCategory
                ? handleUpdateCategory
                : handleCreateCategory
            }
            className="admin-category-form"
          >
            <div className="admin-category-field">
              <label htmlFor="categoryName">
                Category Name
              </label>

              <input
                id="categoryName"
                type="text"
                placeholder="e.g. JavaScript"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                maxLength={50}
                disabled={actionLoading}
              />
            </div>

            <div className="admin-category-field">
              <label htmlFor="categoryDescription">
                Description
              </label>

              <textarea
                id="categoryDescription"
                placeholder="Enter category description..."
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                rows="4"
                maxLength={300}
                disabled={actionLoading}
              />
            </div>

            <div className="admin-category-form-actions">

              <button
                type="submit"
                className="admin-category-submit-btn"
                disabled={actionLoading}
              >
                {editingCategory ? (
                  <>
                    <FaEdit />

                    {actionLoading
                      ? "Updating..."
                      : "Update Category"}
                  </>
                ) : (
                  <>
                    <FaPlus />

                    {actionLoading
                      ? "Creating..."
                      : "Create Category"}
                  </>
                )}
              </button>

              {editingCategory && (
                <button
                  type="button"
                  className="admin-category-cancel-btn"
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
            SEARCH
        ====================================== */}

        <div className="admin-category-search-card">

          <div className="admin-category-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search categories..."
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

          <span className="admin-category-result-count">
            {filteredCategories.length} result
            {filteredCategories.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {/* ======================================
            CATEGORY LIST
        ====================================== */}

        <div className="admin-category-list-card">

          <div className="admin-category-list-header">
            <div>
              <h2>
                Categories
              </h2>

              <p>
                Manage all available quiz
                categories.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="admin-category-loading">

              <div className="admin-category-spinner"></div>

              <p>
                Loading categories...
              </p>

            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="admin-category-empty">

              <div className="admin-category-empty-icon">
                <FaFolder />
              </div>

              <h3>
                {search
                  ? "No categories found"
                  : "No categories available"}
              </h3>

              <p>
                {search
                  ? "Try a different search term."
                  : "Create your first category above."}
              </p>

            </div>
          ) : (
            <div className="admin-category-grid">

              {filteredCategories.map(
                (category) => (
                  <div
                    className="admin-category-item"
                    key={category._id}
                  >

                    {/* ==================================
                        CARD TOP
                    ================================== */}

                    <div className="admin-category-item-top">

                      <div className="admin-category-item-icon">
                        <FaFolder />
                      </div>

                      <div className="admin-category-item-actions">

                        {/* EDIT */}

                        <button
                          type="button"
                          className="category-edit-btn"
                          title="Edit category"
                          onClick={() =>
                            handleEditCategory(
                              category
                            )
                          }
                          disabled={
                            actionLoading
                          }
                        >
                          <FaEdit />
                        </button>

                        {/* ACTIVE / INACTIVE */}

                        <button
                          type="button"
                          className={
                            category.isActive
                              ? "category-status-btn active"
                              : "category-status-btn inactive"
                          }
                          title={
                            category.isActive
                              ? "Deactivate category"
                              : "Activate category"
                          }
                          onClick={() =>
                            handleToggleStatus(
                              category
                            )
                          }
                          disabled={
                            actionLoading
                          }
                        >
                          {category.isActive ? (
                            <FaToggleOn />
                          ) : (
                            <FaToggleOff />
                          )}
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          className="category-delete-btn"
                          title="Delete category"
                          onClick={() =>
                            handleDeleteCategory(
                              category
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

                    {/* ==================================
                        CARD CONTENT
                    ================================== */}

                    <div className="admin-category-item-content">

                      <h3>
                        {category.name}
                      </h3>

                      <p>
                        {category.description ||
                          "No description available."}
                      </p>

                    </div>

                    {/* ==================================
                        CREATED DATE
                    ================================== */}

                    <div className="admin-category-item-footer">

                      <span>
                        Created
                      </span>

                      <strong>
                        {formatDate(
                          category.createdAt
                        )}
                      </strong>

                    </div>

                    {/* ==================================
                        STATUS
                    ================================== */}

                    <div
                      className={
                        category.isActive
                          ? "admin-category-status active"
                          : "admin-category-status inactive"
                      }
                    >
                      {category.isActive ? (
                        <>
                          <FaCheckCircle />
                          Active
                        </>
                      ) : (
                        <>
                          <FaToggleOff />
                          Inactive
                        </>
                      )}
                    </div>

                  </div>
                )
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCategories;