import React, { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useApp } from "../../context/AppContext";
import { BookOpen, Plus, Edit2, Trash2 } from "lucide-react";
import { api } from "../../services/api";

const Subjects = () => {
  const { subjects, refreshLearningData } = useApp();
  const [form, setForm] = useState({ name: "", description: "" });
  const [message, setMessage] = useState("");

  const createSubject = async (event) => {
    event.preventDefault();
    try {
      await api.createSubject(form);
      setForm({ name: "", description: "" });
      setMessage("Subject created successfully.");
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
            <h1 className="text-3xl font-bold mb-2">Subject Management</h1>
            <p className="text-gray-400">Manage all educational subjects</p>
          </div>
          <button
            type="submit"
            form="create-subject"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus size={18} />
            Add Subject
          </button>
        </div>

        <form
          id="create-subject"
          onSubmit={createSubject}
          className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-white/5 bg-[#111827]/40 p-4"
        >
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Subject name"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            required
          />
          <input
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Description"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white md:col-span-2"
          />
        </form>
        {message && <div className="mb-4 text-sm text-blue-300">{message}</div>}

        <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-gray-400 font-medium text-sm">
                  Subject
                </th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">
                  Topics
                </th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr
                  key={subject.id}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 bg-${subject.color}-600/20 rounded-xl flex items-center justify-center`}
                      >
                        <BookOpen
                          className={`text-${subject.color}-400`}
                          size={20}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{subject.name}</div>
                        <div className="text-gray-500 text-sm">
                          {subject.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">
                    {subject.topicsCount} Topics
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-blue-400">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Subjects;
