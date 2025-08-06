import React, { useState, useEffect } from "react";
import { getBoards, createBoard } from "../services/api";
import AddForm from "../components/AddForm";

interface Props {
  onSelectBoard: (id: number) => void;
  onLogout: () => void;
}

const DashboardPage: React.FC<Props> = ({ onSelectBoard, onLogout }) => {
  const [boards, setBoards] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    getBoards().then((res) => setBoards(res.data));
  }, []);

  const handleCreateBoard = async (name: string) => {
    const res = await createBoard(name);
    setBoards((prev) => [...prev, res.data]);
  };

  return (
    <>
      <header className="app-header">
        <h1 className="header-title">Project Boards</h1>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </header>
      <main className="dashboard-page">
        <div className="dashboard-content">
          <h2 className="dashboard-header">Your Boards</h2>
          <div className="boards-grid">
            {boards.map((b) => (
              <div
                key={b.id}
                className="board-tile"
                onClick={() => onSelectBoard(b.id)}
              >
                {b.name}
              </div>
            ))}
            <div className="board-tile add-board-tile-form">
              <AddForm
                onSubmit={handleCreateBoard}
                placeholder="Board Title"
                buttonText="Create new board"
                listForm={false}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
export default DashboardPage;
