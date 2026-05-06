import { useEffect, useState } from "react";
import API from "./services/api";
import { io } from "socket.io-client";
import Auth from "./Auth";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

const socket = io("https://task-board-ai-vrvh.onrender.com");

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  // const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));
  const [isAuth, setIsAuth] = useState(null);

  console.log("IS AUTH:", isAuth);

  const fetchTasks = async () => {
    try {
      console.log("FETCH START");

      const res = await API.get("/tasks");

      console.log("TASKS:", res.data);

      setTasks(res.data);
    } catch (err) {
      console.log("FETCH ERROR:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsAuth(true);
    } else {
      setIsAuth(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuth) return; // ⛔ stop if not logged in

    fetchTasks();

    socket.on("taskUpdated", fetchTasks);

    return () => {
      socket.off("taskUpdated", fetchTasks);
    };
  }, [isAuth]);

  // ADD TASK
  const addTask = async () => {
    if (!title) return;

    await API.post("/tasks", {
      title,
      description,
      position: tasks.length,
    });

    setTitle("");
    setDescription("");
  };

  // DELETE
  const deleteTask = async (id) => {
    await API.delete(`/tasks/${id}`);
    fetchTasks();
  };

  // AI GENERATE
  const generateTask = async () => {
    if (!title) return;

    setLoading(true);

    const res = await API.post("/ai/generate", { prompt: title });

    let data;
    try {
      data = JSON.parse(res.data.result);
    } catch {
      const cleaned = res.data.result.replace(/```json|```/g, "").trim();
      data = JSON.parse(cleaned);
    }

    setTitle(data.title);
    setDescription(data.description);
    setLoading(false);
  };

  // DRAG LOGIC (ADVANCED)
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id;
    const overId = over.id;

    const draggedTask = tasks.find((t) => t._id === draggedId);
    const overTask = tasks.find((t) => t._id === overId);

    if (["todo", "inprogress", "done"].includes(overId)) {
      const columnTasks = tasks.filter((t) => t.status === overId);
      await API.put(`/tasks/${draggedId}`, {
        status: overId,
        position: columnTasks.length,
      });
      return;
    }

    if (overTask) {
      const newStatus = overTask.status;

      let columnTasks = tasks
        .filter((t) => t.status === newStatus && t._id !== draggedId)
        .sort((a, b) => a.position - b.position);

      const overIndex = columnTasks.findIndex((t) => t._id === overId);
      columnTasks.splice(overIndex, 0, draggedTask);

      await Promise.all(
        columnTasks.map((task, index) =>
          API.put(`/tasks/${task._id}`, {
            status: newStatus,
            position: index,
          })
        )
      );
    }
  };

  const todo = tasks.filter((t) => t.status === "todo");
  const inprogress = tasks.filter((t) => t.status === "inprogress");
  const done = tasks.filter((t) => t.status === "done");

  // TASK CARD
  function TaskCard({ task }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: task._id,
    });

    const { setNodeRef: setDropRef } = useDroppable({ id: task._id });

    const style = transform
      ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
      : undefined;

    return (
      <div ref={setDropRef}>
        <div
          ref={setNodeRef}
          style={style}
          className="group backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/20"
        >
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing"
          >
            <p className="font-medium">{task.title}</p>
          </div>

          <p className="text-sm text-gray-400 mt-1">{task.description}</p>

          <div className="flex gap-3 mt-3 text-sm opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => setEditingTask(task)}
              className="text-blue-400 hover:text-blue-300"
            >
              Edit
            </button>

            <button
              onClick={() => deleteTask(task._id)}
              className="text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // COLUMN
  function Column({ title, tasks, id }) {
    const { setNodeRef } = useDroppable({ id });

    return (
      <div
        ref={setNodeRef}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[350px] shadow-xl"
      >
        <h2 className="mb-4 font-medium text-lg">{title}</h2>

        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>

        {tasks.length === 0 && (
          <p className="text-gray-400 text-center mt-10">
            No tasks yet 🚀 Start by adding your first task
          </p>
        )}
      </div>
    );
  }

  if (!isAuth) {
    return <Auth setIsAuth={setIsAuth} />;
  }

  if (isAuth === null) {
    return <div className="text-white p-5">Loading...</div>;
  }

  const user = JSON.parse(localStorage.getItem("user")) || "user";
  console.log(user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-4 md:p-6">
      <h1 className="text-3xl font-semibold mb-6">🚀 Task Board</h1>
      <p className="text-sm text-gray-400">Welcome, {user?.name}</p>
      <button
        onClick={() => {
          localStorage.removeItem("token");
          setIsAuth(false);
        }}
        className="mb-4 bg-red-500 px-3 py-1 rounded"
      >
        Logout
      </button>

      {/* INPUT */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 backdrop-blur-xl bg-white/5 border border-white/10 p-3 rounded-2xl">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-4 py-2 bg-transparent outline-none"
        />

        <button
          onClick={addTask}
          className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg"
        >
          Add
        </button>

        <button
          onClick={generateTask}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
            loading
              ? "bg-slate-600 cursor-not-allowed"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Generating...
            </>
          ) : (
            "AI"
          )}
        </button>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description"
        className="w-full mb-6 p-3 rounded-lg bg-white/5 outline-none"
      />

      {/* BOARD */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Column title="Todo" tasks={todo} id="todo" />
          <Column title="In Progress" tasks={inprogress} id="inprogress" />
          <Column title="Done" tasks={done} id="done" />
        </div>
      </DndContext>

      {/* MODAL */}
      {editingTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-slate-900/90 border border-white/10 p-6 rounded-2xl w-80 space-y-3">
            <input
              value={editingTask.title}
              onChange={(e) =>
                setEditingTask({ ...editingTask, title: e.target.value })
              }
              className="w-full p-2 rounded bg-white/10"
            />

            <textarea
              value={editingTask.description}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  description: e.target.value,
                })
              }
              className="w-full p-2 rounded bg-white/10"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingTask(null)}
                className="px-3 py-1 bg-white/10 rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await API.put(`/tasks/${editingTask._id}`, editingTask);
                  setEditingTask(null);
                }}
                className="px-3 py-1 bg-indigo-500 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
