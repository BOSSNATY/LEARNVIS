import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";

const Retry = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto text-center bg-[#111827]/40 border border-white/5 rounded-3xl p-10">
        <h1 className="text-3xl font-bold mb-2">Retry Attempt #{attemptId}</h1>
        <p className="text-gray-400 mb-8">
          Use remastered questions to close the correction loop.
        </p>
        <button
          onClick={() => navigate("/student/revision")}
          className="bg-blue-600 hover:bg-blue-500 rounded-xl px-6 py-3 font-semibold"
        >
          Start Revision First
        </button>
      </div>
    </StudentLayout>
  );
};

export default Retry;
