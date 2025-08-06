import React, { useState } from "react";
import { inviteUserToBoard } from "../services/api";

interface InviteUserFormProps {
  boardId: number;
}

const InviteUserForm: React.FC<InviteUserFormProps> = ({ boardId }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const res = await inviteUserToBoard(boardId, email);
      setMessage(res.data.msg);
      setIsError(false);
      setEmail("");
    } catch (error: any) {
      setMessage(error.response?.data?.msg || "An error occurred.");
      setIsError(true);
    }
    // Clear the success/error message after 3 seconds for a better UX
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="invite-user-form">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: "10px", alignItems: "center" }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Invite user by email..."
          required
          style={{
            flexGrow: 1,
            padding: "8px",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "3px",
            background: "rgba(255,255,255,0.2)",
            color: "white",
          }}
        />
        <button
          type="submit"
          className="logout-button"
          style={{ height: "38px" }}
        >
          Invite
        </button>
      </form>
      {message && (
        <p
          style={{
            color: isError ? "#ff8f73" : "#9cff9c",
            margin: "10px 0 0",
            textAlign: "center",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default InviteUserForm;
