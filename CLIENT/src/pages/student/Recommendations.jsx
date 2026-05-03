import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import {
  Lightbulb,
  ChevronRight,
  BookOpen,
  Clock,
  Target,
  Sparkles,
} from "lucide-react";

const Recommendations = () => {
  const navigate = useNavigate();
  const { subjects, getTopicsBySubject } = useApp();
  const [apiRecommendations, setApiRecommendations] = useState([]);

  const recommendations = [
    {
      type: "continue",
      title: "Continue Learning",
      subject: "Physics",
      topic: "Work, Energy, and Power",
      reason: "You started this topic 2 days ago",
      priority: "high",
      progress: 45,
    },
    {
      type: "weakness",
      title: "Strengthen Weak Areas",
      subject: "Chemistry",
      topic: "Chemical Bonding",
      reason: "Based on your quiz performance",
      priority: "medium",
      progress: 0,
    },
    {
      type: "new",
      title: "Try Something New",
      subject: "Biology",
      topic: "Evolution",
      reason: "Recommended based on your interests",
      priority: "low",
      progress: 0,
    },
    {
      type: "review",
      title: "Review for Mastery",
      subject: "Physics",
      topic: "Motion and Kinematics",
      reason: "You scored 85% - aim for 100%!",
      priority: "medium",
      progress: 100,
    },
    {
      type: "advanced",
      title: "Challenge Yourself",
      subject: "Mathematics",
      topic: "Calculus Basics",
      reason: "You're ready for advanced topics",
      priority: "low",
      progress: 0,
    },
  ];

  useEffect(() => {
    api
      .recommendations()
      .then((data) => {
        const rows = data.weakTopics || data.recommendations || data;
        setApiRecommendations(Array.isArray(rows) ? rows : []);
      })
      .catch(() => setApiRecommendations([]));
  }, []);

  const displayRecommendations = apiRecommendations.length
    ? apiRecommendations.map((item) => ({
        type: item.priority || "weakness",
        title: item.title || item.reason || "Recommended next step",
        subject: item.subject || item.subject_name || "Learning path",
        topic: item.topic || item.topic_title || item.title || "Review topic",
        reason:
          item.reason ||
          `${item.mistake_count || item.frequency || ""} weak signals detected`,
        priority: item.priority || (item.mistake_count > 2 ? "high" : "medium"),
        progress: item.progress || 0,
        topicId: item.topic_id || item.topicId,
      }))
    : recommendations;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-red-500/30 bg-red-600/10";
      case "medium":
        return "border-yellow-500/30 bg-yellow-600/10";
      case "low":
        return "border-blue-500/30 bg-blue-600/10";
      default:
        return "border-white/10 bg-white/5";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "continue":
        return <Clock className="text-blue-400" size={20} />;
      case "weakness":
        return <Target className="text-red-400" size={20} />;
      case "new":
        return <Sparkles className="text-purple-400" size={20} />;
      case "review":
        return <BookOpen className="text-green-400" size={20} />;
      case "advanced":
        return <Lightbulb className="text-yellow-400" size={20} />;
      default:
        return <Lightbulb className="text-gray-400" size={20} />;
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <Lightbulb className="text-purple-400" size={24} />
            </div>
            <h1 className="text-3xl font-bold">Recommendations</h1>
          </div>
          <p className="text-gray-400">
            Personalized suggestions to accelerate your learning
          </p>
        </div>

        {/* AI Insight Card */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold mb-1">AI Learning Insight</h3>
              <p className="text-gray-400 text-sm">
                Based on your recent performance, focusing on Physics concepts
                could significantly improve your overall understanding. You're
                showing strong progress in kinematics!
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          {displayRecommendations.map((rec, index) => (
            <div
              key={index}
              onClick={() =>
                navigate(
                  rec.topicId
                    ? `/student/learn/${rec.topicId}`
                    : "/student/subjects",
                )
              }
              className={`bg-[#111827]/40 backdrop-blur-xl border rounded-2xl p-5 hover:border-blue-500/30 cursor-pointer transition-all group ${getPriorityColor(
                rec.priority,
              )}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  {getTypeIcon(rec.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {rec.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        rec.priority === "high"
                          ? "bg-red-600/20 text-red-400"
                          : rec.priority === "medium"
                            ? "bg-yellow-600/20 text-yellow-400"
                            : "bg-blue-600/20 text-blue-400"
                      }`}
                    >
                      {rec.priority} priority
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{rec.topic}</h3>
                  <p className="text-gray-400 text-sm">{rec.subject}</p>
                  <p className="text-gray-500 text-sm mt-1">{rec.reason}</p>
                  {rec.progress > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${rec.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {rec.progress}%
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Learning Path Suggestion */}
        <div className="mt-8 bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Suggested Learning Path</h3>
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {["Motion Basics", "Forces", "Energy", "Momentum", "Waves"].map(
              (step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 flex-shrink-0"
                >
                  <div
                    className={`px-4 py-2 rounded-xl ${
                      index < 2
                        ? "bg-green-600/20 text-green-400 border border-green-500/30"
                        : index === 2
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "bg-white/5 text-gray-400 border border-white/10"
                    }`}
                  >
                    {step}
                  </div>
                  {index < 4 && (
                    <ChevronRight
                      size={16}
                      className={index < 2 ? "text-green-500" : "text-gray-600"}
                    />
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Recommendations;
