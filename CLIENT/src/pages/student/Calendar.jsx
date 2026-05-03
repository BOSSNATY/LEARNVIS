import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";
import { CalendarCheck, CheckCircle } from "lucide-react";

const Calendar = () => {
  const [days, setDays] = useState([]);

  const loadCalendar = () =>
    api
      .calendar()
      .then((data) => setDays(data.days || []))
      .catch(() => setDays([]));

  useEffect(() => {
    loadCalendar();
  }, []);

  const complete = async (taskId) => {
    await api.completeCalendarSession({ taskId }).catch(() => null);
    loadCalendar();
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Study Calendar</h1>
          <p className="text-gray-400">
            Your plan grouped by date from the calendar API.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {days.length === 0 && (
            <div className="text-gray-400">
              No scheduled tasks yet. Generate a plan first.
            </div>
          )}
          {days.map((day) => (
            <div
              key={day.date}
              className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <CalendarCheck className="text-blue-400" /> {day.date}
              </h3>
              <div className="space-y-3">
                {day.tasks.map((task) => (
                  <div key={task.id} className="bg-white/5 rounded-xl p-3">
                    <div className="font-medium">{task.topic_title}</div>
                    <div className="text-sm text-gray-400">
                      {task.session_type || task.task_type} - {task.status}
                    </div>
                    {task.status !== "completed" && (
                      <button
                        onClick={() => complete(task.id)}
                        className="mt-3 text-green-400 text-sm flex items-center gap-1"
                      >
                        <CheckCircle size={15} /> Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Calendar;
