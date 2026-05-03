import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../services/api";
import { BarChart3, BookOpen, Target, Users } from "lucide-react";

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .analyticsAdmin()
      .then(setOverview)
      .catch((error) => setMessage(error.message));
  }, []);

  const cards = [
    {
      label: "Learning states",
      value: overview?.learningState?.length || 0,
      icon: BookOpen,
      color: "blue",
    },
    {
      label: "Recent quizzes",
      value: overview?.quizHistory?.length || 0,
      icon: Target,
      color: "green",
    },
    {
      label: "Weak concepts",
      value: overview?.weakConcepts?.length || 0,
      icon: BarChart3,
      color: "purple",
    },
    {
      label: "Tasks tracked",
      value: overview?.tasks?.total || 0,
      icon: Users,
      color: "yellow",
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
          <p className="text-gray-400">
            Live analytics from the backend analytics routes.
          </p>
        </div>
        {message && (
          <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-600/10 p-3 text-yellow-300">
            {message}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/5 bg-[#111827]/40 p-5"
            >
              <card.icon className={`text-${card.color}-400 mb-3`} />
              <div className="text-3xl font-bold">{card.value}</div>
              <div className="text-sm text-gray-400">{card.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/5 bg-[#111827]/40 p-6">
            <h2 className="font-bold mb-4">Weak Concepts</h2>
            {(overview?.weakConcepts || []).map((item, index) => (
              <div
                key={index}
                className="flex justify-between border-b border-white/5 py-2"
              >
                <span>{item.concept_tag}</span>
                <span className="text-red-400">{item.frequency}</span>
              </div>
            ))}
          </section>
          <section className="rounded-2xl border border-white/5 bg-[#111827]/40 p-6">
            <h2 className="font-bold mb-4">Recent Quiz History</h2>
            {(overview?.quizHistory || []).slice(0, 8).map((item, index) => (
              <div
                key={index}
                className="flex justify-between border-b border-white/5 py-2"
              >
                <span>{item.topic_title}</span>
                <span className="text-blue-400">{item.score}%</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
