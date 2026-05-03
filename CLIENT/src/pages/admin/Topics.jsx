import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { FileText, Plus } from "lucide-react";

const Topics = () => {
  const { subjects, topics, refreshLearningData } = useApp();
  const [form, setForm] = useState({
    subjectId: "",
    title: "",
    description: "",
    difficulty: "medium",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!form.subjectId && subjects[0]?.id)
      setForm((current) => ({ ...current, subjectId: subjects[0].id }));
  }, [subjects, form.subjectId]);

  const allTopics = Object.values(topics).flat();

  const createTopic = async (event) => {
    event.preventDefault();
    try {
      await api.createTopic(form);
      setForm({ ...form, title: "", description: "" });
      setMessage("Topic created successfully.");
      await refreshLearningData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Topic Management</h1>
            <p className="text-gray-400">
              Create and review topics connected to subjects.
            </p>
          </div>
          <button
            type="submit"
            form="create-topic"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Create Topic
          </button>
        </div>

        <form
          id="create-topic"
          onSubmit={createTopic}
          className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-white/5 bg-[#111827]/40 p-4"
        >
          <select
            value={form.subjectId}
            onChange={(event) =>
              setForm({ ...form, subjectId: event.target.value })
            }
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            required
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            placeholder="Topic title"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            required
          />
          <select
            value={form.difficulty}
            onChange={(event) =>
              setForm({ ...form, difficulty: event.target.value })
            }
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <input
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Description"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </form>
        {message && <div className="mb-4 text-sm text-blue-300">{message}</div>}

        <div className="rounded-2xl border border-white/5 bg-[#111827]/40 overflow-hidden">
          {allTopics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center gap-4 border-b border-white/5 p-4"
            >
              <div className="rounded-xl bg-purple-600/20 p-3">
                <FileText className="text-purple-400" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{topic.title}</h3>
                <p className="text-sm text-gray-400">
                  {topic.description || "No description"}
                </p>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">
                {topic.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Topics;
