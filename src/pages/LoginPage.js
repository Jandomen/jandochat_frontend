import React from "react";
import LoginForm from "../components/Auth/LoginForm";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onLoginSuccess = ({ userData, token }) => {
    login({ userData, token });
    navigate("/chat");
  };

  return <LoginForm onLoginSuccess={onLoginSuccess} />;
}
