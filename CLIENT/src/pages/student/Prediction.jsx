import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";

const Predictions = () => {
  const { subjects } = useApp();
  const [predictions, setPredictions] = useState([]);
  useEffect(() => {
    api
      .predictions()
      .then(setPredictions)
      .catch(() => setPredictions([]));
  }, []);
  const generate = async (subjectId) => {
    const result = await api.prediction(subjectId);
    setPredictions((prev) => [result, ...prev]);
  };
  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Score Predictions</h1>
        <p className="text-gray-400 mb-8">
          Estimate future exam performance based on quizzes, mastery,
          consistency, and mock exams.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => generate(s.id)}
              className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 text-left hover:border-blue-500/30"
            >
              <h3 className="font-bold">{s.name}</h3>
              <p className="text-gray-400 text-sm">Generate prediction</p>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {predictions.map((p, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-5">
              <div className="text-3xl font-bold text-blue-400">
                {p.predictedScore || p.predicted_score}%
              </div>
              <p className="text-gray-400">
                Subject: {p.subject_name || p.subjectId || p.subject_id}
              </p>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Predictions;
