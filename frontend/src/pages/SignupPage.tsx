import React, { useState } from "react";
import { register } from "../services/api";

interface SignupPageProps {
  onLoginSuccess: () => void;
  onSwitchToLogin: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({
  onLoginSuccess,
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      const response = await register(email, password);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        onLoginSuccess();
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
      console.error(err);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <form onSubmit={handleSubmit}>
        <h2>Sign Up for TrelloClone</h2>
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
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}
        <button type="submit">Sign Up</button>
        <p className="auth-switch-text">
          Already have an account?{" "}
          <a href="#" onClick={onSwitchToLogin}>
            Log in
          </a>
        </p>
      </form>
    </div>
  );
};

export default SignupPage;
