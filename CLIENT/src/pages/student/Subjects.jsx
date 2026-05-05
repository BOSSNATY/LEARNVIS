import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";

const Subjects = () => {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [userSubjects, setUserSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.dashboard();

      setSubjects(data.allSubjects || []);
      setUserSubjects(data.subjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (subjectId) => {
    try {
      setEnrolling(subjectId);
      await api.enrollSubject(subjectId);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (id) => userSubjects.some((s) => s.id === id);

  const getSubjectProgress = (id) => {
    const s = userSubjects.find((x) => x.id === id);
    return s?.progress || 0;
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-20 text-gray-400">Loading...</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Subjects</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((subject) => {
            const enrolled = isEnrolled(subject.id);
            const progress = getSubjectProgress(subject.id);

            return (
              <div
                key={subject.id}
                className="bg-[#111827]/40 border border-white/5 p-6 rounded-2xl"
              >
                <h2 className="font-bold text-lg">{subject.name}</h2>
                <p className="text-gray-400 text-sm mb-3">
                  {subject.description}
                </p>

                {enrolled && (
                  <div className="h-2 bg-gray-700 rounded-full mb-3">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* BUTTON LOGIC */}
                {!enrolled ? (
                  <button
                    onClick={() => handleEnroll(subject.id)}
                    className="w-full py-2 bg-blue-600 rounded-xl"
                  >
                    Add Subject
                  </button>
                ) : progress === 0 ? (
                  <button
                    onClick={() => navigate(`/student/subjects/${subject.id}`)}
                    className="w-full py-2 bg-yellow-600/20 text-yellow-300 rounded-xl"
                  >
                    Start
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/student/subjects/${subject.id}`)}
                    className="w-full py-2 bg-green-600/20 text-green-300 rounded-xl"
                  >
                    Continue
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Subjects;
