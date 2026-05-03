import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import StudentLayout from "../../components/StudentLayout";
import { Trophy, Clock, ChevronRight, TrendingUp, Filter } from "lucide-react";

const Results = () => {
  const navigate = useNavigate();
  const { results } = useApp();
  const normalizedResults = Array.isArray(results) ? results : [];
  const averageScore = normalizedResults.length
    ? Math.round(
        normalizedResults.reduce((acc, r) => acc + Number(r.score || 0), 0) /
          normalizedResults.length,
      )
    : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-600/20";
    if (score >= 60) return "bg-yellow-600/20";
    return "bg-red-600/20";
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quiz Results</h1>
            <p className="text-gray-400">Track your performance over time</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="text-gray-400 text-sm mb-1">Total Quizzes</div>
            <div className="text-3xl font-bold">{normalizedResults.length}</div>
          </div>
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="text-gray-400 text-sm mb-1">Average Score</div>
            <div className="text-3xl font-bold text-green-400">
              {averageScore}%
            </div>
          </div>
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="text-gray-400 text-sm mb-1">Best Score</div>
            <div className="text-3xl font-bold text-blue-400">
              {normalizedResults.length
                ? Math.max(
                    ...normalizedResults.map((r) => Number(r.score || 0)),
                  )
                : 0}
              %
            </div>
          </div>
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="text-gray-400 text-sm mb-1">Improvement</div>
            <div className="text-3xl font-bold text-purple-400 flex items-center gap-2">
              <TrendingUp size={20} />
              +12%
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-white/5 text-sm text-gray-400 font-medium">
            <div className="col-span-2">Quiz Name</div>
            <div>Score</div>
            <div>Date</div>
            <div className="text-right">Action</div>
          </div>
          <div className="divide-y divide-white/5">
            {normalizedResults.map((result) => {
              const score = Number(result.score || 0);
              const quizName =
                result.quizName ||
                result.topic_title ||
                result.quiz_name ||
                "Quiz attempt";
              const date =
                result.date ||
                result.completed_at?.slice?.(0, 10) ||
                result.finished_at?.slice?.(0, 10) ||
                "-";
              return (
                <div
                  key={result.id}
                  className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-white/5 transition-all"
                >
                  <div className="col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                        <Trophy className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <div className="font-medium">{quizName}</div>
                        <div className="text-gray-500 text-sm">
                          {result.correct_count ??
                            result.questionsCorrect ??
                            "-"}
                          /
                          {result.total_questions ??
                            result.totalQuestions ??
                            "-"}{" "}
                          correct
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full ${getScoreBg(
                        score,
                      )} ${getScoreColor(score)} font-semibold`}
                    >
                      {score}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-300">{date}</div>
                    <div className="text-gray-500 text-sm flex items-center gap-1">
                      <Clock size={12} />
                      {result.time ||
                        result.completed_at?.slice?.(11, 16) ||
                        ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() =>
                        navigate(`/student/quiz/${result.id}/result`)
                      }
                      className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl text-sm font-medium transition-all"
                    >
                      View Details
                      <ChevronRight size={16} className="inline ml-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Results;
