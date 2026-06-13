import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import StudentLayout from "../../components/StudentLayout";
import {
  ArrowLeft,
  Clock,
  ChevronRight,
  CheckCircle,
  X,
  HelpCircle,
  FileText,
  Lightbulb,
} from "lucide-react";
import { api } from "../../services/api";

const Quiz = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const { getTopicById, quizQuestions } = useApp();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [serverQuizId, setServerQuizId] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState(quizQuestions);
  const [serverResult, setServerResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState(null);

  const topic = getTopicById(topicId);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const taskId = searchParams.get("taskId");
  const quizType = searchParams.get("type") || "practice";

  useEffect(() => {
    if (!topicId) return;
    api
      .generateQuiz({ topicId, mode: quizType })
      .then(async (generated) => {
        const quizId = generated.quizId || generated.id;
        setServerQuizId(quizId);

        if (generated.timeLimitSeconds) {
          setTimeLeft(generated.timeLimitSeconds);
        }
        const [quizQuestionsFromApi, attempt] = await Promise.all([
          api.quiz(quizId),
          api.startAttempt(quizId).catch(() => null),
        ]);
        if (attempt?.attemptId) setAttemptId(attempt.attemptId);
        setQuestions(
          quizQuestionsFromApi.map((question) => ({
            id: question.id || question.question_id,
            question: question.question_text,
            type:
              question.cognitive_category === "calculation"
                ? "application"
                : question.cognitive_category,
            options: question.options.map((option) => option.option_text),
            optionIds: question.options.map((option) => option.id),
            correctAnswer: question.options.findIndex(
              (option) => option.is_correct,
            ),
          })),
        );
      })
      .catch((err) => {
        console.error("Quiz generation failed:", err);
        setError("AI is busy right now. Please try again.");
        setQuestions([]);
      });
  }, [topicId]);

  useEffect(() => {
    if (timeLeft === null || showResult) return;

    if (timeLeft <= 0) {
      handleNext(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  if (!topic) {
    return (
      <StudentLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Quiz not found</h2>
          <button
            onClick={() => navigate("/student/subjects")}
            className="text-blue-400"
          >
            Back to subjects
          </button>
        </div>
      </StudentLayout>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = async (forceSubmit = false) => {
    let updatedAnswers = answers;
    if (selectedAnswer !== null) {
      updatedAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      setAnswers(updatedAnswers);
    }

    if (forceSubmit !== true && currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(updatedAnswers[currentQuestion + 1] ?? null);
    } else {
      let finalScore = calculateScore();

      // Recalculate score locally to ensure we use the latest answers
      let correct = 0;
      questions.forEach((q, index) => {
        if (updatedAnswers[index] === q.correctAnswer) correct++;
      });
      finalScore = Math.round((correct / questions.length) * 100);

      if (serverQuizId) {
        try {
          const payload = questions.map((q, index) => ({
            questionId: q.id,
            selectedOption: q.options?.[updatedAnswers[index]],
            conceptTag: q.type || "general",
          }));
          const res = await api.submitQuiz(serverQuizId, {
            attemptId,
            answers: payload,
            topicId,
          });
          setServerResult(res);
          finalScore = res?.score ?? finalScore;
        } catch (_error) {
          setServerResult(null);
        }
      }
      if (quizType === "mandatory" && taskId) {
        if (finalScore === 100) {
          await api.completeTask(taskId, { understanding_score: finalScore });
        }
      }
      setShowResult(true);
    }
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case "conceptual":
        return <HelpCircle size={16} className="text-blue-400" />;
      case "explanation":
        return <FileText size={16} className="text-green-400" />;
      case "application":
        return <Lightbulb size={16} className="text-yellow-400" />;
      default:
        return null;
    }
  };

  const getQuestionTypeColor = (type) => {
    switch (type) {
      case "conceptual":
        return "bg-blue-600/20 text-blue-400";
      case "explanation":
        return "bg-green-600/20 text-green-400";
      case "application":
        return "bg-yellow-600/20 text-yellow-400";
      default:
        return "bg-gray-600/20 text-gray-400";
    }
  };

  // Calculate score
  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  };

  if (error) {
    return (
      <StudentLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-red-400 text-lg">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setQuestions([]);
              // Re-trigger the quiz generation
              api
                .generateQuiz({ topicId, mode: quizType })
                .then(async (generated) => {
                  const quizId = generated.quizId || generated.id;
                  setServerQuizId(quizId);
                  if (generated.timeLimitSeconds) {
                    setTimeLeft(generated.timeLimitSeconds);
                  }
                  const [quizQuestionsFromApi, attempt] = await Promise.all([
                    api.quiz(quizId),
                    api.startAttempt(quizId).catch(() => null),
                  ]);
                  if (attempt?.attemptId) setAttemptId(attempt.attemptId);
                  setQuestions(
                    quizQuestionsFromApi.map((question) => ({
                      id: question.id || question.question_id,
                      question: question.question_text,
                      type:
                        question.cognitive_category === "calculation"
                          ? "application"
                          : question.cognitive_category,
                      options: question.options.map(
                        (option) => option.option_text,
                      ),
                      optionIds: question.options.map((option) => option.id),
                      correctAnswer: question.options.findIndex(
                        (option) => option.is_correct,
                      ),
                    })),
                  );
                })
                .catch(() =>
                  setError(
                    "Still unavailable. Please wait a moment and try again.",
                  ),
                );
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all"
          >
            🔄 Retry Quiz Generation
          </button>
        </div>
      </StudentLayout>
    );
  }

  if (showResult) {
    const score = serverResult?.score ?? calculateScore();
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
            <div
              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
                score >= 80
                  ? "bg-green-600/20"
                  : score >= 50
                    ? "bg-yellow-600/20"
                    : "bg-red-600/20"
              }`}
            >
              <span className="text-4xl font-bold">{score}%</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
            <p className="text-gray-400 mb-6">
              You answered{" "}
              {
                Object.values(answers).filter(
                  (a, i) => a === questions[i]?.correctAnswer,
                ).length
              }{" "}
              out of {questions.length} questions correctly.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {questions.filter((q) => q.type === "conceptual").length}
                </div>
                <div className="text-gray-400 text-sm">Conceptual</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">
                  {questions.filter((q) => q.type === "explanation").length}
                </div>
                <div className="text-gray-400 text-sm">Explanation</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-yellow-400">
                  {questions.filter((q) => q.type === "application").length}
                </div>
                <div className="text-gray-400 text-sm">Application</div>
              </div>
            </div>

            <div className="flex gap-4">
              {quizType === "mandatory" ? (
                score === 100 ? (
                  <button
                    onClick={() => navigate("/student/dashboard")}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    <CheckCircle size={20} /> Mastered! Unlock Next Topic
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      navigate(`/student/revision/${topicId}?taskId=${taskId}`)
                    }
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/20"
                  >
                    Start AI Targeted Revision
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={() => navigate("/student/results")}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all"
                  >
                    View Results
                  </button>
                  <button
                    onClick={() => navigate(`/student/learn/${topicId}`)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-all"
                  >
                    Review Topic
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Exit Quiz</span>
        </button>

        {/* Quiz Header */}
        <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">{topic.title} - Quiz</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span
                className={`font-semibold px-3 py-1 rounded-lg ${timeLeft !== null && timeLeft <= 60 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-blue-500/20 text-blue-400"}`}
              >
                {timeLeft !== null
                  ? `⏱ ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`
                  : "⏱ Calculating..."}
              </span>

              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
          {/* Question Type Badge */}
          <div className="flex items-center gap-2 mb-6">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getQuestionTypeColor(
                question.type,
              )}`}
            >
              {getQuestionTypeIcon(question.type)}
              {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-semibold mb-8">{question.question}</h2>

          {/* Answer Options */}
          {question.options ? (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedAnswer === index
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                        selectedAnswer === index
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-gray-200">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Type your answer here..."
            />
          )}

          {/* Action Buttons */}
          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => {
                if (currentQuestion > 0) {
                  let updatedAnswers = answers;
                  if (selectedAnswer !== null) {
                    updatedAnswers = {
                      ...answers,
                      [currentQuestion]: selectedAnswer,
                    };
                    setAnswers(updatedAnswers);
                  }
                  setCurrentQuestion(currentQuestion - 1);
                  setSelectedAnswer(
                    updatedAnswers[currentQuestion - 1] ?? null,
                  );
                }
              }}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-all"
              disabled={currentQuestion === 0}
            >
              Previous
            </button>

            <button
              onClick={() => handleNext(false)}
              disabled={selectedAnswer === null}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {currentQuestion === questions.length - 1
                ? "Finish Quiz"
                : "Next Question"}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Question Navigator */}
        {/* Question Navigator */}
        <div className="mt-6 bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  let updatedAnswers = answers;
                  if (selectedAnswer !== null) {
                    updatedAnswers = {
                      ...answers,
                      [currentQuestion]: selectedAnswer,
                    };
                    setAnswers(updatedAnswers);
                  }
                  setCurrentQuestion(index);
                  setSelectedAnswer(updatedAnswers[index] ?? null);
                }}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  index === currentQuestion
                    ? "bg-blue-600 text-white"
                    : answers[index] !== undefined
                      ? "bg-green-600/20 text-green-400 border border-green-500/30"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Quiz;
