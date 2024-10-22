import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const raw = JSON.stringify({ name, username, email, password });
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    };

    try {
      const response = await fetch(
        "https://quiz-app-student-test.vercel.app/api/auth/register",
        requestOptions
      );
      const result = await response.json();
      if (response.ok) {
        toast.success("Registration successful! Please log in.");
        navigate("/login");
      } else {
        toast.error(result.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 items-center justify-center min-h-screen bg-slate-200">
      {/* Image Section */}
      <div className="w-full h-64 lg:h-full lg:col-span-2">
        <img
          src="/test.jpg"
          alt="Test"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Form Section */}
      <form
        onSubmit={handleSubmit}
        className="col-span-3 flex flex-col space-y-4 p-8 md:p-16 lg:p-28 w-full"
      >
        <div className="flex items-center flex-col justify-center mb-8 lg:mb-16 w-full">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-[50px] h-[50px] lg:w-[70px] lg:h-[70px]"
          />
          <span className="font-bold text-2xl lg:text-3xl capitalize mt-4 text-center">
            Juadeb's Test App - Register
          </span>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          required
          className="py-3 px-4 border border-gray-300 rounded w-full"
        />

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          className="py-3 px-4 border border-gray-300 rounded w-full"
        />

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="py-3 px-4 border border-gray-300 rounded w-full"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="py-3 px-4 border border-gray-300 rounded w-full"
        />

        <button
          type="submit"
          className="py-3 px-5 bg-blue-500 text-white rounded w-full md:w-[70%] lg:w-[60%] mx-auto disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </button>

        <Link to="/login" className="mt-4 mx-auto">
          <span className="font-bold text-blue-500 hover:underline mr-2">
            Click Here
          </span>
          If You Already Have An Account
        </Link>
      </form>
    </div>
  );
}

export default Register;
