const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Task = require("../models/Task");
const { deleteTask, updateTask } = require("../controllers/taskController");

// GET tasks (only user's tasks)
router.get("/", auth, async (req, res) => {
  const tasks = await Task.find({ user: req.user.id }).sort({ position: 1 });
  res.json(tasks);
});

// CREATE
router.post("/", auth, async (req, res) => {
  const task = await Task.create({
    title: req.body.title,
    description: req.body.description,
    position: req.body.position || 0,
    status: "todo", // ✅ REQUIRED
    user: req.user.id, // ✅ REQUIRED
  });

  res.json(task);
});

router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
