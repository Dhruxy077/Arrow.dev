import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";
import { ArrowRight, CircleSlash, Link } from "lucide-react";

const Hero = () => {
  const [userInput, setuserInput] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setuserInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (userInput && userInput.trim() !== "") {
        handlesubmit();
        navigate("/builder", { state: { userInput: userInput } });
      }
    }
  };

  const handlesubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // console.log(userInput);
    } catch (error) {
      console.error("error submitting the message:", error.message);
      setError("Failed to process the request.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <h1 className="text-gray-100 text-5xl font-bold">
        What do you want to build today?
      </h1>
      <h3 className="text-lg text-gray-300">Prompt, Create, Run and Edit</h3>

      <div className="w-xl flex items-center p-3 rounded-lg outline-amber-50 outline-2 rounded-e-3xl rounded-l-3xl ">
        <textarea
          className="max-40 w-full h-32 overflow-y-auto overflow-x-hidden break-words bg-transparent text-white outline-none placeholder-gray-400 resize-none p-2 box-border rounded-md scrollbar-hide"
          placeholder="How can Arrow help you today?"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        ></textarea>
        <span className=" items-center justify-center pb-18">
          <button
            className="bg-amber-50 rounded-xl size-10 flex items-center justify-center ml-0 mr-1 mt-0 mb-1"
            onClick={handlesubmit}
            disabled={loading}
          >
            {loading ? (
              <CircleSlash size={20} color="black" strokeWidth={2} />
            ) : (
              <ArrowRight size={20} color="black" strokeWidth={2} />
            )}
          </button>
        </span>
      </div>
      {error && <p className="text-red-500 text-center">{error}</p>}
    </div>
  );
};
export default Hero;
