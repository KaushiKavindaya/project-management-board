const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

// --- HELPER FUNCTIONS ---
const getUserIdFromToken = (req) => {
    try {
        if (!req.headers.authorization) return null;
        const token = req.headers.authorization.split(' ')[1];
        return jwt.verify(token, process.env.JWT_SECRET).id;
    } catch (error) { return null; }
};

const checkBoardMembership = async (userId, boardId) => {
    if (!userId || !boardId) return false;
    const [membership] = await db.query('SELECT * FROM board_members WHERE user_id = ? AND board_id = ?', [userId, boardId]);
    return membership.length > 0;
};


// --- AUTHENTICATION ROUTES ---
router.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Please enter all fields' });
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) return res.status(400).json({ message: 'User already exists' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const [result] = await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
        const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (err) { console.error("Register Error:", err); res.status(500).send('Server Error'); }
});

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ message: 'Invalid credentials' });
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) { console.error("Login Error:", err); res.status(500).send('Server Error'); }
});


// --- BOARD ROUTES ---
router.get('/boards', protect, async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const [boards] = await db.query('SELECT b.id, b.name FROM boards b JOIN board_members bm ON b.id = bm.board_id WHERE bm.user_id = ?', [userId]);
        res.json(boards);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

router.post('/boards', protect, async (req, res) => {
    const { name } = req.body;
    const userId = getUserIdFromToken(req);
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [boardRes] = await conn.query('INSERT INTO boards (name, user_id) VALUES (?, ?)', [name, userId]);
        const boardId = boardRes.insertId;
        await conn.query('INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)', [boardId, userId, 'owner']);
        await conn.commit();
        res.status(201).json({ id: boardId, name });
    } catch (err) { await conn.rollback(); console.error(err); res.status(500).send('Server Error'); } 
    finally { conn.release(); }
});

router.get('/boards/:id', protect, async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const boardId = req.params.id;
        if (!await checkBoardMembership(userId, boardId)) return res.status(403).json({ msg: 'Forbidden' });
        const [boards] = await db.query('SELECT * FROM boards WHERE id = ?', [boardId]);
        if (!boards[0]) return res.status(404).json({ msg: 'Board not found' });
        const board = boards[0];
        const [lists] = await db.query('SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC', [boardId]);
        for (let list of lists) {
            const [cards] = await db.query('SELECT * FROM cards WHERE list_id = ? ORDER BY position ASC', [list.id]);
            list.cards = cards;
        }
        board.lists = lists;
        res.json(board);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

router.post('/boards/:id/members', protect, async (req, res) => {
    try {
        const { email } = req.body;
        const boardId = req.params.id;
        const inviterId = getUserIdFromToken(req);
        if (!await checkBoardMembership(inviterId, boardId)) return res.status(403).json({ msg: 'Forbidden' });
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ msg: 'User with that email not found.' });
        await db.query('INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)', [boardId, users[0].id, 'member']);
        res.status(201).json({ msg: 'User added to the board.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ msg: 'User is already a member of this board.' });
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// --- LIST ROUTES ---
router.post('/lists', protect, async (req, res) => {
    try {
        const { board_id, name } = req.body;
        const userId = getUserIdFromToken(req);
        if (!await checkBoardMembership(userId, board_id)) return res.status(403).json({ msg: 'Forbidden' });
        const [countResult] = await db.query('SELECT COUNT(*) as listCount FROM lists WHERE board_id = ?', [board_id]);
        const position = countResult[0].listCount;
        const [result] = await db.query('INSERT INTO lists (board_id, name, position) VALUES (?, ?, ?)', [board_id, name, position]);
        req.io.to(`board-${board_id}`).emit('board-updated');
        res.status(201).json({ id: result.insertId, name, position, cards: [] });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

router.delete('/lists/:id', protect, async (req, res) => {
    try {
        const listId = req.params.id;
        const userId = getUserIdFromToken(req);
        const [list] = await db.query('SELECT board_id FROM lists WHERE id = ?', [listId]);
        if (!list[0] || !await checkBoardMembership(userId, list[0].board_id)) return res.status(403).json({ msg: 'Forbidden' });
        await db.query('DELETE FROM lists WHERE id = ?', [listId]);
        req.io.to(`board-${list[0].board_id}`).emit('board-updated');
        res.json({ msg: 'List removed' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

router.put('/lists/reorder', protect, async (req, res) => {
    try {
        const { boardId, orderedListIds } = req.body;
        const userId = getUserIdFromToken(req);
        if (!await checkBoardMembership(userId, boardId)) return res.status(403).json({ msg: 'Forbidden' });
        const updatePromises = orderedListIds.map((id, index) => db.query('UPDATE lists SET position = ? WHERE id = ?', [index, id]));
        await Promise.all(updatePromises);
        req.io.to(`board-${boardId}`).emit('board-updated');
        res.json({ msg: 'Lists reordered' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});


// --- CARD ROUTES ---
router.post('/cards', protect, async (req, res) => {
    try {
        const { list_id, content } = req.body;
        const userId = getUserIdFromToken(req);
        const [list] = await db.query('SELECT board_id FROM lists WHERE id = ?', [list_id]);
        if (!list[0] || !await checkBoardMembership(userId, list[0].board_id)) return res.status(403).json({ msg: 'Forbidden' });
        const [countResult] = await db.query('SELECT COUNT(*) as cardCount FROM cards WHERE list_id = ?', [list_id]);
        const position = countResult[0].cardCount;
        const [result] = await db.query('INSERT INTO cards (list_id, content, position) VALUES (?, ?, ?)', [list_id, content, position]);
        req.io.to(`board-${list[0].board_id}`).emit('board-updated');
        res.status(201).json({ id: result.insertId, content, position, list_id });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

router.delete('/cards/:id', protect, async (req, res) => {
    try {
        const cardId = req.params.id;
        const userId = getUserIdFromToken(req);
        const [card] = await db.query('SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?', [cardId]);
        if (!card[0] || !await checkBoardMembership(userId, card[0].board_id)) return res.status(403).json({ msg: 'Forbidden' });
        await db.query('DELETE FROM cards WHERE id = ?', [cardId]);
        req.io.to(`board-${card[0].board_id}`).emit('board-updated');
        res.json({ msg: 'Card removed' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

router.put('/cards/move', protect, async (req, res) => {
    try {
        const { cardId, newListId, newPosition } = req.body;
        const userId = getUserIdFromToken(req);
        const [list] = await db.query('SELECT board_id FROM lists WHERE id = ?', [newListId]);
        if (!list[0] || !await checkBoardMembership(userId, list[0].board_id)) return res.status(403).json({ msg: 'Forbidden' });
        await db.query('UPDATE cards SET list_id = ?, position = ? WHERE id = ?', [newListId, newPosition, cardId]);
        req.io.to(`board-${list[0].board_id}`).emit('board-updated');
        res.json({ msg: 'Card moved successfully' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});


// --- CARD DETAIL & COMMENT ROUTES ---
router.get('/cards/:id/details', protect, async (req, res) => {
    try {
        const cardId = req.params.id;
        const userId = getUserIdFromToken(req);
        const [cardCheck] = await db.query('SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?', [cardId]);
        if (!cardCheck[0] || !await checkBoardMembership(userId, cardCheck[0].board_id)) return res.status(403).json({ msg: 'Forbidden' });
        const [cards] = await db.query('SELECT * FROM cards WHERE id = ?', [cardId]);
        if (cards.length === 0) return res.status(404).json({ msg: 'Card not found' });
        const card = cards[0];
        const [comments] = await db.query('SELECT c.*, u.email FROM comments c JOIN users u ON c.user_id = u.id WHERE c.card_id = ? ORDER BY c.created_at ASC', [cardId]);
        card.comments = comments;
        res.json(card);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

router.put('/cards/:id/details', protect, async (req, res) => {
    try {
        const cardId = req.params.id;
        const userId = getUserIdFromToken(req);
        const [cardCheck] = await db.query('SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?', [cardId]);
        if (!cardCheck[0] || !await checkBoardMembership(userId, cardCheck[0].board_id)) return res.status(403).json({ msg: 'Forbidden' });
        const { content, description, due_date } = req.body;
        const fieldsToUpdate = {};
        if (content !== undefined) fieldsToUpdate.content = content;
        if (description !== undefined) fieldsToUpdate.description = description;
        if (due_date !== undefined) fieldsToUpdate.due_date = due_date || null;
        if (Object.keys(fieldsToUpdate).length > 0) {
            await db.query('UPDATE cards SET ? WHERE id = ?', [fieldsToUpdate, cardId]);
        }
        req.io.to(`board-${cardCheck[0].board_id}`).emit('board-updated');
        res.json({ msg: 'Card details updated' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

router.post('/comments', protect, async (req, res) => {
    try {
        const { card_id, text } = req.body;
        const userId = getUserIdFromToken(req);
        const [cardCheck] = await db.query('SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?', [card_id]);
        if (!cardCheck[0] || !await checkBoardMembership(userId, cardCheck[0].board_id)) return res.status(403).json({ msg: 'Forbidden' });
        const [result] = await db.query('INSERT INTO comments (card_id, user_id, text) VALUES (?, ?, ?)', [card_id, userId, text]);
        const [newComment] = await db.query('SELECT c.*, u.email FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [result.insertId]);
        req.io.to(`board-${cardCheck[0].board_id}`).emit('board-updated');
        res.status(201).json(newComment[0]);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});


module.exports = router;