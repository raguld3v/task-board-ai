import axios from "axios";

const API = axios.create({
  baseURL: "https://task-board-ai-vrvh.onrender.com/api",
});

// attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  console.log("TOKEN SENT:", token);

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
