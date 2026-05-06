import { useState } from "react";
import API from "./services/api";

function Auth({ setIsAuth }) {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    try {
      if (isLogin) {
        const res = await API.post("/auth/login", { email, password });

        // ✅ SAVE TOKEN HERE
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        setIsAuth(true);
      } else {
        await API.post("/auth/register", {
          name,
          email,
          password,
        });

        alert("Registered! Now login.");
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="bg-slate-800 p-6 rounded-xl w-80 space-y-3">
        <h2 className="text-xl font-semibold">
          {isLogin ? "Login" : "Register"}
        </h2>

        {!isLogin && (
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-slate-700"
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-slate-700"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-slate-700"
        />

        <button onClick={submit} className="w-full bg-indigo-500 py-2 rounded">
          {isLogin ? "Login" : "Register"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-blue-400 cursor-pointer"
        >
          {isLogin ? "Create account" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}

export default Auth;
