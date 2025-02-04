const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use cloud database URL
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, // Required for cloud DBs
});

// Fetch all tasks
app.get("/tasks", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add a new task
app.post("/tasks", async (req, res) => {
    try {
        const { title } = req.body;

        if (!title.trim()) {
            return res.status(400).json({ error: "Task title cannot be empty" });
        }

        const result = await pool.query("INSERT INTO tasks (title) VALUES ($1) RETURNING *", [title]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error adding task:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete a task
app.delete("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update a task
app.put("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!title.trim()) {
            return res.status(400).json({ error: "Task title cannot be empty" });
        }

        const result = await pool.query("UPDATE tasks SET title = $1 WHERE id = $2 RETURNING *", [title, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
