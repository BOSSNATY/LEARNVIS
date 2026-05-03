import React, { useState } from "react";
import { useParams } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";
import { UploadCloud } from "lucide-react";

const ContentUpload = () => {
  const { topicId } = useParams();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const upload = async (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append("topicId", topicId);
    data.append("type", "note");
    data.append("file", file);
    try {
      await api.uploadContent(data);
      setMessage("Material uploaded successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload Learning Material</h1>
        <p className="text-gray-400 mb-8">
          Attach notes, past papers, or study resources for this topic.
        </p>
        <form
          onSubmit={upload}
          className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 space-y-5"
        >
          <label className="border border-dashed border-white/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5">
            <UploadCloud className="text-blue-400 mb-3" size={40} />
            <span className="font-semibold">
              {file ? file.name : "Choose a file"}
            </span>
            <span className="text-gray-500 text-sm mt-1">
              PDF, image, text, or document
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0])}
              required
            />
          </label>
          <button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3 font-semibold">
            Upload
          </button>
          {message && <p className="text-blue-300 text-sm">{message}</p>}
        </form>
      </div>
    </StudentLayout>
  );
};

export default ContentUpload;
