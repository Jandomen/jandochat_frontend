import React from "react";
import RegisterForm from "../components/Auth/RegisterForm";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onRegisterSuccess = ({ userData, token }) => {
    login({ userData, token });
    navigate("/chat");
  };

  return <RegisterForm onRegisterSuccess={onRegisterSuccess} />;
}
