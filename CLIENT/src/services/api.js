const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const getToken = () => localStorage.getItem("learnvis-token");
export const getRefreshToken = () =>
  localStorage.getItem("learnvis-refresh-token");

export const setSession = ({ token, refreshToken, user }) => {
  if (token) localStorage.setItem("learnvis-token", token);
  if (refreshToken)
    localStorage.setItem("learnvis-refresh-token", refreshToken);
  if (user) localStorage.setItem("learnvis-user", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("learnvis-token");
  localStorage.removeItem("learnvis-refresh-token");
  localStorage.removeItem("learnvis-user");
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("learnvis-user"));
  } catch (_error) {
    return null;
  }
};

const request = async (path, options = {}, retry = true) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && retry && getRefreshToken()) {
    try {
      const refreshed = await request(
        "/auth/refresh",
        {
          method: "POST",
          body: { refreshToken: getRefreshToken() },
        },
        false,
      );
      setSession(refreshed);
      return request(path, options, false);
    } catch (_error) {
      clearSession();
    }
  }
  if (!response.ok) {
    throw new Error(data.message || data.error || "API request failed");
  }
  return data;
};

const requestFallback = async (paths, options = {}) => {
  let lastError;
  for (const path of paths) {
    try {
      return await request(path, options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

export const decodeJwtPayload = (credential) => {
  const payload = credential?.split(".")?.[1];
  if (!payload) return null;
  try {
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch (_error) {
    return null;
  }
};

export const api = {
  health: () => request("/health"),
  signup: (payload) =>
    request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  logout: () =>
    request("/auth/logout", {
      method: "POST",
      body: { refreshToken: getRefreshToken() },
    }),
  refresh: () =>
    request("/auth/refresh", {
      method: "POST",
      body: { refreshToken: getRefreshToken() },
    }),
  googleLogin: (credential) =>
    request("/auth/google", { method: "POST", body: { credential } }),
  dashboard: () => request("/dashboard"),
  me: () => request("/users/me"),
  updateMe: (payload) => request("/users/me", { method: "PUT", body: payload }),
  users: () => request("/users"),
  updateUser: (id, payload) =>
    request(`/users/${id}`, { method: "PUT", body: payload }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
  subjects: () => requestFallback(["/users/subjects", "/subjects"]),
  createSubject: (payload) =>
    requestFallback(["/subjects", "/users/subject"], {
      method: "POST",
      body: payload,
    }),
  enrollSubject: (id) =>
    requestFallback([`/subjects/${id}/enroll`, "/users/select"], {
      method: "POST",
      body: { subjectId: id },
    }),
  topics: (subjectId) =>
    subjectId
      ? requestFallback([
          `/topics/${subjectId}`,
          `/topics?subjectId=${subjectId}`,
        ])
      : request("/topics"),
  topic: (id) => request(`/topics/single/${id}`),
  createTopic: (payload) =>
    request("/topics", {
      method: "POST",
      body: payload,
    }),
  deleteTopic: (topicId) =>
    requestFallback([`/topics/topics/${topicId}`], {
      method: "DELETE",
    }),
    createStudyPlan: (data) => request("/study-plans", { method: "POST", body: data }),
  
  generatePlanTasks: (planId, payload) => request(`/study-plans/${planId}/generate`, { method: "POST", body: payload }),
  
  planTasks: (planId) => request(`/study-plans/${planId}/tasks`),

  startSession: (data) => request("/study-sessions/start", { method: "POST", body: data }),
  
  startSessionFromTask: (taskId) => request(`/study-sessions/start-from-task/${taskId}`, { method: "POST" }),
  
  endSession: (data) => request("/study-sessions/end", { method: "POST", body: data }),
  
  todayTasks: () => request("/study-tasks/today"),
  
  completeTask: (taskId, payload = {}) => request(`/study-tasks/${taskId}/complete`, { method: "POST", body: payload }),

  
  content: (topicId, sessionId, taskId) => request(`/content/${topicId}?sessionId=${sessionId}&taskId=${taskId}`),
  generateContent: (payload) =>
    request("/content/generate", { method: "POST", body: payload }),
  uploadContent: async (formData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/content/upload`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.message || data.error || "Upload failed");
    return data;
  },
  planner: () => request("/planner"),
  createPlan: (payload) =>
    request("/planner", { method: "POST", body: payload }),
  deletePlan: (planId) => request(`/planner/${planId}`, { method: "DELETE" }),
  calendar: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/calendar${query ? `?${query}` : ""}`);
  },
  completeCalendarSession: (payload) =>
    request("/calendar/complete-session", { method: "POST", body: payload }),
  generateQuiz: (payload) =>
    request("/quiz/generate", { method: "POST", body: payload }),
  quiz: (id) => request(`/quiz/${id}`),
  startAttempt: (id) => request(`/quiz/${id}/attempt`, { method: "POST" }),
  submitQuiz: (id, payload) =>
    request(`/quiz/${id}/submit`, {
      method: "POST",
      body: payload.answers ? payload : { answers: payload },
    }),
  results: () => requestFallback(["/results", "/analytics/overview"]),
  quizResult: (quizId) => request(`/quiz/${quizId}/result`),
  analyticsMe: () => requestFallback(["/analytics/me", "/analytics/overview"]),
  analyticsAdmin: () =>
    requestFallback(["/analytics/admin", "/analytics/overview"]),
  recommendations: () =>
    requestFallback(["/recommendations", "/mistakes/weak-topics"]),
  mistakes: () => request("/analytics/mistakes"),
  weakTopics: () => request("/mistakes/weak-topics"),
  dueRevisions: () => request("/revision/due"),
  revisionHistory: () => request("/revision/history"),
  scheduleRevision: (payload) =>
    request("/revision/schedule", { method: "POST", body: payload }),
  completeRevision: (revisionId, payload) =>
    request(`/revision/${revisionId}/complete`, {
      method: "POST",
      body: payload,
    }),
  predictions: () => request("/prediction"),
  prediction: (subjectId) => request(`/prediction/${subjectId}`),
  mockExams: () => request("/mock"),
  generateMock: (payload) =>
    request("/mock/generate", { method: "POST", body: payload }),
  mockExam: (id) => request(`/mock/${id}`),
  submitMock: (id, answers) =>
    request(`/mock/${id}/submit`, { method: "POST", body: { answers } }),
  mockResult: (id) => request(`/mock/${id}/result`),
};
