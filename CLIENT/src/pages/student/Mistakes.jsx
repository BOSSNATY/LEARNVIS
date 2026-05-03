import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";
import { AlertTriangle } from "lucide-react";

const Mistakes = () => {
  const [data, setData] = useState({
    byTopic: [],
    byConcept: [],
    recentMistakes: [],
  });
  useEffect(() => {
    api
      .mistakes()
      .then(setData)
      .catch(() => setData({ byTopic: [], byConcept: [], recentMistakes: [] }));
  }, []);
  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mistake Analysis</h1>
        <p className="text-gray-400 mb-8">
          Concept gaps and recurring mistakes detected by the learning engine.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6">
            <h2 className="font-bold mb-4">Weak Concepts</h2>
            {(data.byConcept || []).map((item, i) => (
              <div
                key={i}
                className="flex justify-between py-2 border-b border-white/5"
              >
                <span>{item.concept_tag}</span>
                <span className="text-red-400">{item.frequency}</span>
              </div>
            ))}
          </section>
          <section className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6">
            <h2 className="font-bold mb-4">Recent Mistakes</h2>
            {(data.recentMistakes || []).map((item, i) => (
              <div key={i} className="py-3 border-b border-white/5">
                <AlertTriangle
                  className="inline text-yellow-400 mr-2"
                  size={16}
                />
                {item.topic}
                <p className="text-gray-500 text-sm">
                  Correct: {item.correct_answer}
                </p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Mistakes;
