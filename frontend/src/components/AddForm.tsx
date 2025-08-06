import React, { useState } from "react";

interface AddFormProps {
  onSubmit: (title: string) => void;
  placeholder?: string;
  buttonText: string;
  listForm?: boolean; // <-- THE MISSING PROP
}

const AddForm: React.FC<AddFormProps> = ({
  onSubmit,
  placeholder,
  buttonText,
  listForm,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle("");
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="add-form-container">
        <button
          onClick={() => setIsEditing(true)}
          className={`add-form-button ${listForm ? "list-form" : ""}`}
        >
          + {buttonText}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="add-form-controls"
      onBlur={() => setIsEditing(false)}
    >
      {listForm ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          className="add-form-input"
        />
      ) : (
        <textarea
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          className="add-form-input"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit(e);
          }}
        />
      )}
      <div className="add-form-actions">
        <button type="submit">Add</button>
        <button
          type="button"
          className="add-form-close-btn"
          onClick={() => setIsEditing(false)}
        >
          ×
        </button>
      </div>
    </form>
  );
};
export default AddForm;
