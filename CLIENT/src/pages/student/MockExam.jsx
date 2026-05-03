import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { FileQuestion, Timer } from "lucide-react";

export const MockExamList = () => {
  const navigate = useNavigate();
  const { subjects } = useApp();
  const [exams, setExams] = useState([]);
  const load = () =>
    api
      .mockExams()
      .then(setExams)
      .catch(() => setExams([]));
  useEffect(() => {
    load();
  }, []);
  const generate = async (subjectId) => {
    const exam = await api.generateMock({ subjectId, durationMinutes: 60 });
    navigate(`/student/mock-exam/${exam.examId}`);
  };
  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mock Exams</h1>
        <p className="text-gray-400 mb-8">
          Generate exam simulations from your practiced and mastered topics.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => generate(s.id)}
              className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 text-left hover:border-blue-500/30"
            >
              <FileQuestion className="text-blue-400 mb-3" />
              <h3 className="font-bold">{s.name} Mock</h3>
              <p className="text-gray-400 text-sm">60 minute simulation</p>
            </button>
          ))}
        </div>
        <h2 className="font-bold mb-4">Previous exams</h2>
        <div className="space-y-3">
          {exams.map((exam) => (
            <button
              key={exam.id}
              onClick={() => navigate(`/student/mock-exam/${exam.id}/result`)}
              className="w-full bg-white/5 rounded-xl p-4 text-left flex justify-between"
            >
              <span>{exam.subject_name}</span>
              <span>{exam.score ?? "Not submitted"}</span>
            </button>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
};

export const MockExamTake = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  useEffect(() => {
    api
      .mockExam(id)
      .then(setExam)
      .catch(() => setExam(null));
  }, [id]);
  const submit = async () => {
    const payload = Object.entries(answers).map(
      ([questionId, selectedOption]) => ({
        questionId: Number(questionId),
        selectedOption,
      }),
    );
    await api.submitMock(id, payload);
    navigate(`/student/mock-exam/${id}/result`);
  };
  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mock Exam</h1>
        <p className="text-gray-400 mb-8 flex items-center gap-2">
          <Timer size={18} /> {exam?.durationMinutes || 60} minutes
        </p>
        <div className="space-y-5">
          {(exam?.questions || []).map((q) => {
            const questionId = q.id || q.question_id;
            return (
              <div
                key={questionId}
                className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5"
              >
                <h3 className="font-semibold mb-4">{q.question_text}</h3>
                {q.options?.map((o) => (
                  <button
                    key={o.id}
                    onClick={() =>
                      setAnswers({ ...answers, [questionId]: o.option_text })
                    }
                    className={`block w-full text-left mb-2 rounded-xl px-4 py-3 ${answers[questionId] === o.option_text ? "bg-blue-600" : "bg-white/5"}`}
                  >
                    {o.option_text}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        <button
          onClick={submit}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3 font-bold"
        >
          Submit Exam
        </button>
      </div>
    </StudentLayout>
  );
};

export const MockExamResult = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  useEffect(() => {
    api
      .mockResult(id)
      .then(setResult)
      .catch(() => setResult(null));
  }, [id]);
  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto text-center bg-[#111827]/40 border border-white/5 rounded-3xl p-10">
        <h1 className="text-3xl font-bold mb-2">Mock Exam Result</h1>
        <div className="text-6xl font-bold text-blue-400 my-8">
          {result?.score ?? 0}%
        </div>
        <p className="text-gray-400">
          {result?.subject_name || "Exam completed"}
        </p>
      </div>
    </StudentLayout>
  );
};

export default MockExamList;
