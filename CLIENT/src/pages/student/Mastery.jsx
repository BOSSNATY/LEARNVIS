import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";

const Mastery = () => {
  const { topicId } = useParams();
  const [weak, setWeak] = useState([]);
  useEffect(() => {
    api
      .weakTopics()
      .then((data) => setWeak(data.weakTopics || []))
      .catch(() => setWeak([]));
  }, []);
  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mastery Tracker</h1>
        <p className="text-gray-400 mb-8">
          Topic #{topicId} mastery and weak-topic loop.
        </p>
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-bold mb-4">Weak topics</h2>
          {weak.map((w) => (
            <div
              key={w.topic_id}
              className="flex justify-between border-b border-white/5 py-3"
            >
              <span>{w.title}</span>
              <span className="text-red-400">{w.mistake_count}</span>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Mastery;
