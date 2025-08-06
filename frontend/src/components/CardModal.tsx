import React, { useState, useEffect, useRef } from "react";
import { ICard, IComment, IList } from "../types";
import {
  getCardDetails,
  updateCardDetails,
  addComment,
  moveCard,
} from "../services/api";

interface CardModalProps {
  cardId: number;
  lists: IList[];
  onClose: () => void;
  onDataChange: () => void;
}

const CardModal: React.FC<CardModalProps> = ({ cardId, lists, onClose }) => {
  const [card, setCard] = useState<ICard | null>(null);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [newComment, setNewComment] = useState("");
  const [targetListId, setTargetListId] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCardDetails(cardId).then((res) => {
      setCard(res.data);
      setDescription(res.data.description || "");
      setEditableTitle(res.data.content);
      setDueDate(res.data.due_date ? res.data.due_date.split("T")[0] : "");
      setTargetListId(res.data.list_id);
    });
  }, [cardId]);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  const handleDetailUpdate = async (
    field: "content" | "description" | "due_date",
    value: string | null
  ) => {
    if (!card) return;
    // Make the API call. The WebSocket event will handle the UI refresh.
    await updateCardDetails(card.id, { [field]: value });
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (card && editableTitle.trim() && editableTitle !== card.content) {
      handleDetailUpdate("content", editableTitle);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleBlur();
    else if (e.key === "Escape") {
      setEditableTitle(card?.content || "");
      setIsEditingTitle(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !card) return;
    await addComment(card.id, newComment);
    setNewComment("");
  };

  const handleMoveCard = async () => {
    if (!card || targetListId === null || targetListId === card.list_id) return;
    const targetList = lists.find((list) => list.id === targetListId);
    const newPosition = targetList ? targetList.cards.length : 0;
    await moveCard(card.id, targetListId, newPosition);
    onClose();
  };

  if (!card)
    return (
      <div className="modal-overlay">
        <div className="modal-content">Loading...</div>
      </div>
    );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>
        <div className="modal-section">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              className="modal-title-input"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
            />
          ) : (
            <h3
              className="modal-title-display"
              onClick={() => setIsEditingTitle(true)}
            >
              {editableTitle}
            </h3>
          )}
          <p>
            in list <u>{lists.find((l) => l.id === card.list_id)?.name}</u>
          </p>
        </div>
        <div className="modal-main-content">
          <div className="modal-details">
            <div className="modal-section">
              <h3>Description</h3>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleDetailUpdate("description", description)}
                placeholder="Add a more detailed description..."
              />
            </div>
            <div className="modal-section">
              <h3>Activity</h3>
              <form onSubmit={handleAddComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                />
                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={!newComment.trim()}
                >
                  Save Comment
                </button>
              </form>
              <div className="comment-list">
                {card.comments
                  ?.map((c) => (
                    <div key={c.id} className="comment">
                      <p className="comment-author">{c.email}</p>
                      <div className="comment-text">{c.text}</div>
                      <p className="comment-date">
                        {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                  .reverse()}
              </div>
            </div>
          </div>
          <div className="modal-sidebar">
            <div className="modal-section">
              <h3>Move Card</h3>
              <select
                value={targetListId || ""}
                onChange={(e) => setTargetListId(Number(e.target.value))}
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <button onClick={handleMoveCard} className="modal-save-btn">
                Move
              </button>
            </div>
            <div className="modal-section">
              <h3>Due Date</h3>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={() => handleDetailUpdate("due_date", dueDate)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
