import { Navigate } from "react-router-dom";
import { getStoredUser } from "../services/api";

const PublicRoute = ({ children }) => {
  const user = getStoredUser();

  if (user) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
