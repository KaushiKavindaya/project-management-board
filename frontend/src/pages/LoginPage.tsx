import React, { useState } from "react";
import { login } from "../services/api";

interface LoginPageProps {
  onLoginSuccess: () => void;
  onSwitchToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onSwitchToSignup,
}) => {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await login(email, password);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        onLoginSuccess();
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error(err);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <form onSubmit={handleSubmit}>
        <h2>Log In</h2>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}
        <button type="submit">Log In</button>
        <p className="auth-switch-text">
          Don't have an account?{" "}
          <a href="#" onClick={onSwitchToSignup}>
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
