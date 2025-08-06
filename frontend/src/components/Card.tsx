import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { ICard } from "../types";
import { deleteCard } from "../services/api";

interface CardProps {
  card: ICard;
  index: number;
  onCardClick: (cardId: number) => void;
  onDataChange: () => void; // This prop is kept for potential future use but is not called directly on delete.
}

const Card: React.FC<CardProps> = ({ card, index, onCardClick }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this card?")) {
      // CORRECTED: Just call the API. The socket event will handle the UI update.
      deleteCard(card.id);
    }
  };

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided) => (
        <div
          className="card-item"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onCardClick(card.id)}
        >
          {card.content}
          <button className="card-delete-btn" onClick={handleDelete}>
            ×
          </button>
        </div>
      )}
    </Draggable>
  );
};

export default Card;
