# 🎓 QuizMaster

### Quiz Management & Online Assessment Platform

QuizMaster is a modern full-stack web application designed to provide an interactive and efficient online quiz and assessment experience.

It allows learners to discover quizzes, attempt timed assessments, track their performance, and view results. Administrators can manage quizzes, users, categories, publishing status, analytics, and leaderboard data from a dedicated admin dashboard.

---

## ✨ Features

### 👨‍🎓 Learner

- 🔐 User Registration & Login
- 🛡️ JWT Authentication
- 🔎 Browse, Search & Filter Quizzes
- 📚 Quiz Categories
- 📝 Multiple Choice Questions
- ⏱️ Countdown Quiz Timer
- 📊 Real-time Quiz Progress
- ↔️ Previous & Next Navigation
- 🔢 Question Navigator
- 💾 Quiz Progress Persistence
- ⚡ Automatic Submission on Timeout
- 🧮 Automatic Answer Evaluation
- 📈 Detailed Quiz Results
- 🏆 Leaderboard
- 📊 Performance Tracking

### 👨‍💼 Admin

- 📊 Admin Dashboard
- ➕ Create Quiz
- ✏️ Edit Quiz
- 🗑️ Delete Quiz
- 📢 Publish / Unpublish Quiz
- 📂 Manage Categories
- 👥 Manage Users
- 🔎 Search Users
- 📈 Quiz Analytics
- 🏆 Leaderboard
- 📊 Performance Statistics

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React | User Interface |
| Vite | Development & Build Tool |
| React Router | Application Routing |
| Axios | API Communication |
| React Icons | UI Icons |
| CSS | Styling & Responsive Design |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| bcryptjs | Password Hashing |
| dotenv | Environment Variables |
| CORS | Cross-Origin Requests |

---

## 🏗️ Project Architecture

```text
Quiz-Management-Platform
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
