import { Navigate } from "react-router-dom";
import  useAuth  from "../../hooks/useAuth";

export default function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/chat" />;
}
