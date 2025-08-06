import React from "react";
import {
  Droppable,
  DraggableProvidedDragHandleProps,
} from "react-beautiful-dnd";
import { IList } from "../types";
import Card from "./Card";
import AddForm from "./AddForm";
import { createCard, deleteList } from "../services/api";

interface ListProps {
  list: IList;
  onDataChange: () => void;
  onCardClick: (id: number) => void;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}

const List: React.FC<ListProps> = ({
  list,
  onDataChange,
  onCardClick,
  dragHandleProps,
}) => {
  // CORRECTED: Just call the API. The socket event will handle the UI update.
  const handleAddCard = async (content: string) => {
    await createCard(list.id, content);
  };

  // CORRECTED: Just call the API. The socket event will handle the UI update.
  const handleDeleteList = async () => {
    if (
      window.confirm(`Are you sure you want to delete the list "${list.name}"?`)
    ) {
      await deleteList(list.id);
    }
  };

  return (
    <section className="list-wrapper">
      <header className="list-header" {...dragHandleProps}>
        <h3>{list.name}</h3>
        <button className="list-delete-btn" onClick={handleDeleteList}>
          ×
        </button>
      </header>
      <div className="list-cards-container">
        <Droppable droppableId={String(list.id)} type="card">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ minHeight: 1 }}
            >
              {list.cards.map((card, index) => (
                <Card
                  key={card.id}
                  card={card}
                  index={index}
                  onCardClick={onCardClick}
                  onDataChange={onDataChange}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
      <AddForm
        onSubmit={handleAddCard}
        placeholder="Enter a title for this card..."
        buttonText="Add a card"
        listForm={false}
      />
    </section>
  );
};

export default List;
