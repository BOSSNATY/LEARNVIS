import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../services/api";
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Mail,
  UserPlus,
  Download,
} from "lucide-react";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = () => {
    api
      .users()
      .then((rows) => setUsers(Array.isArray(rows) ? rows : []))
      .catch((error) => setMessage(error.message));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      String(user.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      String(user.email || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const parseSubjects = (subjects) => {
    if (Array.isArray(subjects)) return subjects;
    if (typeof subjects === "string" && subjects.length)
      return subjects.split(",").map((item) => item.trim());
    return [];
  };

  const editUserRole = async (user) => {
    const role = window.prompt(
      "Enter role: student or admin",
      user.role || "student",
    );
    if (!role || !["student", "admin"].includes(role)) return;
    await api
      .updateUser(user.id, { name: user.name, email: user.email, role })
      .catch((error) => setMessage(error.message));
    loadUsers();
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name || user.email}?`)) return;
    await api.deleteUser(user.id).catch((error) => setMessage(error.message));
    loadUsers();
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-gray-400">
              Manage student accounts and permissions
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-2 transition-all">
              <Download size={18} />
              Export
            </button>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl flex items-center gap-2 transition-all">
              <UserPlus size={18} />
              Add User
            </button>
          </div>
        </div>

        {/* Stats */}
        {message && (
          <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-600/10 p-3 text-sm text-yellow-300">
            {message}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
            <div className="text-gray-400 text-sm mb-1">Total Users</div>
            <div className="text-2xl font-bold">{users.length}</div>
          </div>
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
            <div className="text-gray-400 text-sm mb-1">Active Today</div>
            <div className="text-2xl font-bold text-green-400">12</div>
          </div>
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
            <div className="text-gray-400 text-sm mb-1">New This Week</div>
            <div className="text-2xl font-bold text-blue-400">8</div>
          </div>
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
            <div className="text-gray-400 text-sm mb-1">Avg. Progress</div>
            <div className="text-2xl font-bold text-purple-400">66%</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1f2937]/40 border border-white/5 rounded-xl py-3 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50"
            />
          </div>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-2 transition-all">
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">
                    User
                  </th>
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">
                    Email
                  </th>
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">
                    Subjects
                  </th>
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">
                    Progress
                  </th>
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">
                    Joined
                  </th>
                  <th className="text-right p-4 text-gray-400 font-medium text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const subjectList = parseSubjects(user.subjects);
                  const progress = Number(
                    user.progress ?? user.average_score ?? 0,
                  );
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-all"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                            {String(user.name || user.email || "U").charAt(0)}
                          </div>
                          <span className="font-medium">
                            {user.name || "Unnamed user"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{user.email}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {subjectList.slice(0, 2).map((subject, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                            >
                              {subject}
                            </span>
                          ))}
                          {subjectList.length > 2 && (
                            <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-full">
                              +{subjectList.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-400">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">
                        {user.joined || user.created_at?.slice?.(0, 10) || "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            title="View"
                          >
                            <Eye size={16} className="text-gray-400" />
                          </button>
                          <button
                            onClick={() => editUserRole(user)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            title="Edit role"
                          >
                            <Edit2 size={16} className="text-blue-400" />
                          </button>
                          <button
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            title="Email"
                          >
                            <Mail size={16} className="text-gray-400" />
                          </button>
                          <button
                            onClick={() => deleteUser(user)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Users;
