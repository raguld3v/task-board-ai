const Task = require("../models/Task");

// Create Task
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);

    const io = req.app.get("io");
    io.emit("taskUpdated");

    res.json(task);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Get All Tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ position: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json(err);
  }
};

// update task
exports.updateTask = async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // 👈 returns updated document
    );

    const io = req.app.get("io");
    io.emit("taskUpdated");

    if (!updated) {
      return res.status(404).json({ msg: "Task not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
};

// delete task
exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");
    io.emit("taskUpdated");

    if (!deleted) {
      return res.status(404).json({ msg: "Task not found" });
    }

    res.json({ msg: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};
