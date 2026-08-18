const mongoose = require("mongoose");
require("dotenv").config();

const Quiz = require("./models/Quiz");

const questions = [
  {
    question: "Which keyword is used to declare a constant in JavaScript?",
    options: ["var", "let", "const", "static"],
    correctAnswer: "const",
    points: 1,
  },
  {
    question: "Which method is used to add an element to the end of an array?",
    options: ["push()", "pop()", "shift()", "unshift()"],
    correctAnswer: "push()",
    points: 1,
  },
  {
    question: "Which symbol is used for strict equality in JavaScript?",
    options: ["==", "=", "===", "!="],
    correctAnswer: "===",
    points: 1,
  },
  {
    question: "Which method converts a JSON string into a JavaScript object?",
    options: [
      "JSON.parse()",
      "JSON.stringify()",
      "JSON.convert()",
      "JSON.object()",
    ],
    correctAnswer: "JSON.parse()",
    points: 1,
  },
  {
    question: "Which keyword is used to define a function?",
    options: ["function", "def", "func", "method"],
    correctAnswer: "function",
    points: 1,
  },
  {
    question: "Which value represents an empty or unknown value in JavaScript?",
    options: ["undefined", "empty", "zero", "false"],
    correctAnswer: "undefined",
    points: 1,
  },
  {
    question: "Which method removes the last element from an array?",
    options: ["push()", "pop()", "shift()", "slice()"],
    correctAnswer: "pop()",
    points: 1,
  },
  {
    question: "Which operator is used for logical AND?",
    options: ["||", "&&", "!", "&"],
    correctAnswer: "&&",
    points: 1,
  },
  {
    question: "Which keyword creates a block-scoped variable?",
    options: ["var", "let", "define", "static"],
    correctAnswer: "let",
    points: 1,
  },
  {
    question: "Which method is used to convert a JavaScript object into a JSON string?",
    options: [
      "JSON.parse()",
      "JSON.stringify()",
      "JSON.convert()",
      "JSON.toStringObject()",
    ],
    correctAnswer: "JSON.stringify()",
    points: 1,
  },
  {
    question: "What is the result of typeof 'Hello'?",
    options: ["text", "String", "string", "character"],
    correctAnswer: "string",
    points: 1,
  },
  {
    question: "Which method creates a new array by applying a function to every element?",
    options: ["filter()", "map()", "reduce()", "forEach()"],
    correctAnswer: "map()",
    points: 1,
  },
  {
    question: "Which method returns a new array containing elements that pass a test?",
    options: ["map()", "filter()", "find()", "reduce()"],
    correctAnswer: "filter()",
    points: 1,
  },
  {
    question: "Which statement is used to stop a loop?",
    options: ["stop", "exit", "break", "continue"],
    correctAnswer: "break",
    points: 1,
  },
  {
    question: "Which statement skips the current iteration of a loop?",
    options: ["skip", "continue", "next", "pass"],
    correctAnswer: "continue",
    points: 1,
  },
  {
    question: "Which keyword is used to create a class in JavaScript?",
    options: ["object", "class", "struct", "prototype"],
    correctAnswer: "class",
    points: 1,
  },
  {
    question: "Which function is used to execute code after a specified delay?",
    options: [
      "setTimeout()",
      "setDelay()",
      "delay()",
      "wait()",
    ],
    correctAnswer: "setTimeout()",
    points: 1,
  },
  {
    question: "Which method combines two or more arrays?",
    options: ["join()", "concat()", "merge()", "combine()"],
    correctAnswer: "concat()",
    points: 1,
  },
  {
    question: "Which keyword refers to the current object?",
    options: ["self", "current", "this", "object"],
    correctAnswer: "this",
    points: 1,
  },
  {
    question: "Which JavaScript feature allows a function to remember variables from its outer scope?",
    options: [
      "Closure",
      "Inheritance",
      "Loop",
      "Hoisting",
    ],
    correctAnswer: "Closure",
    points: 1,
  },
];

const seedQuiz = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const quiz = await Quiz.findOne({
      title: "JavaScript Fundamentals",
    });

    if (!quiz) {
      console.log(
        "JavaScript Fundamentals quiz not found."
      );

      process.exit(1);
    }

    quiz.questions = questions;
    quiz.duration = 20;
    quiz.totalPoints = 20;
    quiz.isPublished = true;

    await quiz.save();

    console.log("");
    console.log("=================================");
    console.log("Quiz updated successfully!");
    console.log("=================================");
    console.log(`Title: ${quiz.title}`);
    console.log(`Questions: ${quiz.questions.length}`);
    console.log(`Duration: ${quiz.duration} minutes`);
    console.log(`Total Points: ${quiz.totalPoints}`);
    console.log("=================================");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error(
      "Seed Quiz Error:",
      error.message
    );

    process.exit(1);
  }
};

seedQuiz();