import { createContext, useContext, useEffect, useState } from "react";
import { api, getStoredUser } from "../services/api";

const AppContext = createContext();

// Mock data for the application
const mockSubjects = [
  {
    id: 1,
    name: "Physics",
    description: "Explore the fundamental laws of nature",
    icon: "Atom",
    color: "blue",
    topicsCount: 12,
    progress: 45,
  },
  {
    id: 2,
    name: "Chemistry",
    description: "Understand matter and its transformations",
    icon: "FlaskConical",
    color: "green",
    topicsCount: 15,
    progress: 30,
  },
  {
    id: 3,
    name: "Biology",
    description: "Study living organisms and life processes",
    icon: "Leaf",
    color: "emerald",
    topicsCount: 18,
    progress: 60,
  },
  {
    id: 4,
    name: "Mathematics",
    description: "Master abstract concepts and problem solving",
    icon: "Calculator",
    color: "purple",
    topicsCount: 20,
    progress: 25,
  },
];

const mockTopics = {
  1: [
    {
      id: 1,
      title: "Motion and Kinematics",
      description: "Study of motion without forces",
      difficulty: "Beginner",
      duration: "45 min",
      completed: true,
    },
    {
      id: 2,
      title: "Forces and Newton's Laws",
      description: "Understanding force and motion relationships",
      difficulty: "Intermediate",
      duration: "60 min",
      completed: true,
    },
    {
      id: 3,
      title: "Work, Energy, and Power",
      description: "Energy transformation and conservation",
      difficulty: "Intermediate",
      duration: "55 min",
      completed: false,
    },
    {
      id: 4,
      title: "Momentum and Collisions",
      description: "Conservation of momentum in interactions",
      difficulty: "Intermediate",
      duration: "50 min",
      completed: false,
    },
    {
      id: 5,
      title: "Rotational Motion",
      description: "Angular velocity and acceleration",
      difficulty: "Advanced",
      duration: "70 min",
      completed: false,
    },
    {
      id: 6,
      title: "Waves and Oscillations",
      description: "Wave properties and harmonic motion",
      difficulty: "Intermediate",
      duration: "45 min",
      completed: false,
    },
  ],
  2: [
    {
      id: 7,
      title: "Atomic Structure",
      description: "Structure of atoms and subatomic particles",
      difficulty: "Beginner",
      duration: "40 min",
      completed: true,
    },
    {
      id: 8,
      title: "Chemical Bonding",
      description: "How atoms combine to form compounds",
      difficulty: "Intermediate",
      duration: "55 min",
      completed: false,
    },
    {
      id: 9,
      title: "Chemical Reactions",
      description: "Types and mechanisms of reactions",
      difficulty: "Intermediate",
      duration: "60 min",
      completed: false,
    },
  ],
  3: [
    {
      id: 10,
      title: "Cell Biology",
      description: "Structure and function of cells",
      difficulty: "Beginner",
      duration: "45 min",
      completed: true,
    },
    {
      id: 11,
      title: "Genetics",
      description: "Heredity and genetic variation",
      difficulty: "Intermediate",
      duration: "55 min",
      completed: true,
    },
    {
      id: 12,
      title: "Evolution",
      description: "Theory of evolution and natural selection",
      difficulty: "Intermediate",
      duration: "50 min",
      completed: false,
    },
  ],
  4: [
    {
      id: 13,
      title: "Algebra Fundamentals",
      description: "Variables, equations, and functions",
      difficulty: "Beginner",
      duration: "40 min",
      completed: true,
    },
    {
      id: 14,
      title: "Geometry",
      description: "Shapes, angles, and spatial reasoning",
      difficulty: "Intermediate",
      duration: "50 min",
      completed: false,
    },
    {
      id: 15,
      title: "Calculus Basics",
      description: "Limits, derivatives, and integrals",
      difficulty: "Advanced",
      duration: "70 min",
      completed: false,
    },
  ],
};

const mockQuizQuestions = [
  {
    id: 1,
    question: "What is the SI unit of force?",
    type: "conceptual",
    options: ["Joule", "Newton", "Watt", "Pascal"],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "Explain Newton's First Law of Motion in your own words.",
    type: "explanation",
    correctAnswer:
      "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.",
  },
  {
    id: 3,
    question:
      "A car accelerates from 0 to 20 m/s in 5 seconds. What is its acceleration?",
    type: "application",
    options: ["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"],
    correctAnswer: 1,
  },
  {
    id: 4,
    question: "Which of the following is a vector quantity?",
    type: "conceptual",
    options: ["Mass", "Temperature", "Velocity", "Time"],
    correctAnswer: 2,
  },
  {
    id: 5,
    question: "Calculate the kinetic energy of a 2kg object moving at 3m/s.",
    type: "application",
    options: ["3 J", "6 J", "9 J", "18 J"],
    correctAnswer: 2,
  },
];

const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "student",
    subjects: ["Physics", "Chemistry"],
    progress: 65,
    joined: "2024-01-15",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "student",
    subjects: ["Biology", "Mathematics"],
    progress: 78,
    joined: "2024-02-20",
  },
  {
    id: 3,
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "student",
    subjects: ["Physics"],
    progress: 42,
    joined: "2024-03-10",
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah@example.com",
    role: "student",
    subjects: ["Chemistry", "Biology"],
    progress: 91,
    joined: "2024-01-05",
  },
  {
    id: 5,
    name: "Mike Brown",
    email: "mike@example.com",
    role: "student",
    subjects: ["Mathematics"],
    progress: 55,
    joined: "2024-02-28",
  },
];

const mockResults = [
  {
    id: 1,
    quizName: "Motion and Kinematics",
    score: 85,
    total: 100,
    date: "2024-03-15",
    time: "14:30",
    questionsCorrect: 17,
    totalQuestions: 20,
  },
  {
    id: 2,
    quizName: "Forces and Newton's Laws",
    score: 72,
    total: 100,
    date: "2024-03-18",
    time: "10:15",
    questionsCorrect: 14,
    totalQuestions: 20,
  },
  {
    id: 3,
    quizName: "Atomic Structure",
    score: 90,
    total: 100,
    date: "2024-03-20",
    time: "16:45",
    questionsCorrect: 18,
    totalQuestions: 20,
  },
];

const decorateSubject = (subject) => {
  const visuals = {
    Physics: { icon: "Atom", color: "blue" },
    Chemistry: { icon: "FlaskConical", color: "green" },
    Biology: { icon: "Leaf", color: "emerald" },
    Mathematics: { icon: "Calculator", color: "purple" },
  };
  const name = subject.name?.charAt(0)?.toUpperCase() + subject.name?.slice(1);
  return {
    ...subject,
    name: name || subject.name,
    topicsCount: Number(subject.topicsCount || subject.topics_count || 0),
    progress: Number(subject.progress || 0),
    ...(visuals[name] ||
      visuals[subject.name] || { icon: "BookOpen", color: "blue" }),
  };
};

const decorateTopic = (topic) => {
  const difficultyMap = {
    easy: "Beginner",
    medium: "Intermediate",
    hard: "Advanced",
  };
  return {
    ...topic,
    subject_id: topic.subject_id || topic.subjectId,
    difficulty:
      difficultyMap[topic.difficulty] || topic.difficulty || "Beginner",
    duration: topic.duration || "45 min",
    completed: Boolean(topic.completed),
  };
};

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(
    getStoredUser() || {
      id: 1,
      name: "Demo Student",
      email: "demo@learnvis.com",
      role: "student",
      avatar: null,
    },
  );

  const [subjects, setSubjects] = useState(mockSubjects);
  const [topics, setTopics] = useState(mockTopics);
  const [quizQuestions] = useState(mockQuizQuestions);
  const [users, setUsers] = useState(mockUsers);
  const [results, setResults] = useState(mockResults);
  const [apiReady, setApiReady] = useState(false);

  const refreshLearningData = async () => {
    const subjectRows = await api.subjects();
    const nextSubjects = subjectRows.map(decorateSubject);
    const sourceSubjects = nextSubjects.length ? nextSubjects : mockSubjects;
    const topicResponses = await Promise.all(
      sourceSubjects.map((subject) =>
        api.topics(subject.id).catch(() => mockTopics[subject.id] || []),
      ),
    );
    const topicRows = topicResponses.flat();
    const groupedTopics = topicRows
      .map(decorateTopic)
      .reduce((grouped, topic) => {
        const subjectId = topic.subject_id;
        grouped[subjectId] = grouped[subjectId] || [];
        grouped[subjectId].push(topic);
        return grouped;
      }, {});
    setSubjects(sourceSubjects);
    setTopics(Object.keys(groupedTopics).length ? groupedTopics : mockTopics);
  };

  const refreshPrivateData = async () => {
    try {
      const [resultRows, userRows] = await Promise.all([
        api.results().catch(() => mockResults),
        currentUser?.role === "admin"
          ? api.users().catch(() => mockUsers)
          : Promise.resolve(mockUsers),
      ]);
      const normalizedResults = Array.isArray(resultRows)
        ? resultRows
        : Array.isArray(resultRows?.quizHistory)
          ? resultRows.quizHistory
          : mockResults;
      setResults(normalizedResults.length ? normalizedResults : mockResults);
      setUsers(
        Array.isArray(userRows) && userRows.length ? userRows : mockUsers,
      );
    } catch (_error) {
      setResults(mockResults);
      setUsers(mockUsers);
    }
  };

  useEffect(() => {
    refreshLearningData()
      .then(() => setApiReady(true))
      .catch(() => setApiReady(false));
  }, []);

  useEffect(() => {
    if (currentUser?.id) refreshPrivateData();
  }, [currentUser?.id, currentUser?.role]);

  const getSubjectById = (id) => subjects.find((s) => s.id === parseInt(id));
  const getTopicsBySubject = (subjectId) => topics[subjectId] || [];
  const getTopicById = (topicId) => {
    for (const subjectTopics of Object.values(topics)) {
      const topic = subjectTopics.find((t) => t.id === parseInt(topicId));
      if (topic) return topic;
    }
    return null;
  };

  const value = {
    currentUser,
    setCurrentUser,
    subjects,
    topics,
    quizQuestions,
    users,
    results,
    apiReady,
    refreshLearningData,
    refreshPrivateData,
    getSubjectById,
    getTopicsBySubject,
    getTopicById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
