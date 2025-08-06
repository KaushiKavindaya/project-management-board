import React, { useState, useEffect, useCallback } from "react";
import {
  DragDropContext,
  DropResult,
  Droppable,
  Draggable,
} from "react-beautiful-dnd";
import { getBoard, moveCard, createList, reorderLists } from "../services/api";
import { IBoard } from "../types";
import List from "./List";
import AddForm from "./AddForm";
import CardModal from "./CardModal";
import InviteUserForm from "./InviteUserForm";
import { io, Socket } from "socket.io-client";

interface Props {
  boardId: number;
  onBackToDashboard: () => void;
}

const Board: React.FC<Props> = ({ boardId, onBackToDashboard }) => {
  const [boardData, setBoardData] = useState<IBoard | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [dndKey, setDndKey] = useState(0);

  const fetchBoardData = useCallback(() => {
    getBoard(boardId)
      .then((res) => setBoardData(res.data))
      .catch((err) => console.error("Failed to fetch board data:", err));
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
    const socket: Socket = io("http://localhost:5000");
    socket.emit("joinBoard", boardId);
    socket.on("board-updated", () => {
      setDndKey((k) => k + 1);
      fetchBoardData();
    });
    return () => {
      socket.disconnect();
    };
  }, [boardId, fetchBoardData]);

  const handleAddList = async (name: string) => {
    if (boardData) await createList(boardData.id, name);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination || !boardData) return;

    // Handle List Reordering
    if (type === "list") {
      const newLists = Array.from(boardData.lists);
      const [reorderedItem] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, reorderedItem);
      setBoardData({ ...boardData, lists: newLists });
      reorderLists(
        boardData.id,
        newLists.map((l) => l.id)
      ).catch(() => fetchBoardData());
      return;
    }

    // Handle Card Reordering
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const startList = boardData.lists.find(
      (l) => l.id === parseInt(source.droppableId)
    );
    if (!startList) return;

    const newBoardData = { ...boardData };
    const oldCards = Array.from(startList.cards);
    const [removedCard] = oldCards.splice(source.index, 1);

    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      oldCards.splice(destination.index, 0, removedCard);
      const listIndex = newBoardData.lists.findIndex(
        (l) => l.id === startList.id
      );
      newBoardData.lists[listIndex].cards = oldCards;
    } else {
      // Moving to a different list
      const finishList = newBoardData.lists.find(
        (l) => l.id === parseInt(destination.droppableId)
      );
      if (!finishList) return;
      const finishCards = Array.from(finishList.cards);
      finishCards.splice(destination.index, 0, removedCard);
      const startListIndex = newBoardData.lists.findIndex(
        (l) => l.id === startList.id
      );
      const finishListIndex = newBoardData.lists.findIndex(
        (l) => l.id === finishList.id
      );
      newBoardData.lists[startListIndex].cards = oldCards;
      newBoardData.lists[finishListIndex].cards = finishCards;
    }

    setBoardData(newBoardData);
    moveCard(
      parseInt(draggableId),
      parseInt(destination.droppableId),
      destination.index
    ).catch(() => fetchBoardData());
  };

  if (!boardData) {
    return <div className="board-view">Loading...</div>;
  }

  return (
    <div className="board-view">
      <header className="app-header">
        <h1
          className="header-title"
          onClick={onBackToDashboard}
          style={{ cursor: "pointer" }}
        >
          &larr; Boards
        </h1>
        <div className="board-title">{boardData.name}</div>
        <div>{/* Placeholder for right-aligning content if needed */}</div>
      </header>
      <div className="board-header">
        <InviteUserForm boardId={boardId} />
      </div>
      <main className="board-canvas">
        <DragDropContext key={dndKey} onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="list" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{ display: "flex" }}
              >
                {boardData.lists.map((list, index) => (
                  <Draggable
                    key={list.id}
                    draggableId={String(list.id)}
                    index={index}
                  >
                    {(p) => (
                      <div ref={p.innerRef} {...p.draggableProps}>
                        <List
                          list={list}
                          onCardClick={setSelectedCardId}
                          dragHandleProps={p.dragHandleProps}
                          onDataChange={fetchBoardData}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div className="list-wrapper" style={{ background: "transparent" }}>
          <AddForm
            onSubmit={handleAddList}
            buttonText="Add another list"
            listForm={true}
          />
        </div>
      </main>
      {selectedCardId && (
        <CardModal
          cardId={selectedCardId}
          lists={boardData.lists}
          onClose={() => setSelectedCardId(null)}
          onDataChange={fetchBoardData}
        />
      )}
    </div>
  );
};

export default Board;
