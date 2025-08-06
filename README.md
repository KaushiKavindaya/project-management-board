# Project Management Board (Trello Clone)

A full-stack, real-time, collaborative project management application built with the MERN stack (MySQL, Express.js, React, Node.js). This Trello/Jira clone allows users to create boards, lists, and cards, and manage their projects with a seamless drag-and-drop interface.

<!-- Optional: Add a screenshot or GIF of your application here -->

## Features

- **User Authentication:** Secure user registration and login using JWT (JSON Web Tokens).
- **Dashboard:** View all your project boards in one place.
- **Full CRUD Functionality:** Create, Read, Update, and Delete boards, lists, and cards.
- **Drag & Drop:** Intuitively reorder cards within and between lists, and reorder lists themselves.
- **Real-Time Updates:** Changes made by one user are instantly reflected for all other users on the same board using **WebSockets (Socket.IO)**.
- **Card Details Modal:** Click on a card to open a detailed view with an editable title, description, and comments section.
- **Collaboration:** Invite other registered users to your boards.

## Tech Stack

- **Frontend:** React with TypeScript, React Beautiful DnD
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Real-time Engine:** Socket.IO
- **Authentication:** JWT & bcryptjs

## How to Run Locally

1.  **Prerequisites:**

    - Node.js
    - MySQL Server (e.g., from XAMPP)
    - Git

2.  **Clone the repository:**

    ```bash
    git clone https://github.com/KaushiKavindaya/project-management-board.git
    cd project-management-board
    ```

3.  **Backend Setup:**

    ```bash
    cd backend
    npm install
    # Create a .env file and add your database credentials (see .env.example)
    npm run dev
    ```

4.  **Frontend Setup:**

    ```bash
    cd ../frontend
    npm install
    npm start
    ```

5.  Open your browser and navigate to `http://localhost:3000`.
