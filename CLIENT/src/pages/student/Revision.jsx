import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";
import { RefreshCcw } from "lucide-react";

const Revision = () => {
  const [items, setItems] = useState([]);
  const load = () =>
    api
      .dueRevisions()
      .then((data) => setItems(data.dueRevisions || data || []))
      .catch(() => setItems([]));
  useEffect(() => {
    load();
  }, []);
  const complete = async (id, quality = 2) => {
    await api.completeRevision(id, { quality }).catch(() => null);
    load();
  };
  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Daily Revision</h1>
        <p className="text-gray-400 mb-8">Spaced repetition tasks due today.</p>
        <div className="space-y-4">
          {items.length === 0 && (
            <p className="text-gray-400">No revisions due today.</p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 flex justify-between gap-4"
            >
              <div>
                <h3 className="font-bold">{item.topic_title || item.title}</h3>
                <p className="text-gray-400 text-sm">
                  {item.subject_name || "Revision"}
                </p>
              </div>
              <button
                onClick={() => complete(item.id)}
                className="text-green-400 flex items-center gap-2"
              >
                <RefreshCcw size={18} /> Done
              </button>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Revision;
