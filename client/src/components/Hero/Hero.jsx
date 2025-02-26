import React from "react";
import "./Hero.css";
import { Button } from "../ui/button";
import { MoveRight } from "lucide-react";
import { Link2 } from "lucide-react";
function Hero() {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <h1 className="text-gray-100 text-5xl font-bold">
        What do you want to build today?
      </h1>
      <h3 className="text-lg text-gray-300">Prompt, Create, run and Edit</h3>
      <div
        className="w-full max-w-lg rounded-2xl"
        style={{
          backgroundColor: "#121212",
        }}
      >
        <div className="flex items-center p-3 rounded-lg ">
          <textarea
            className="w-full h-32 overflow-y-auto overflow-x-hidden break-words bg-transparent text-white outline-none placeholder-gray-400 resize-none p-2 box-border rounded-md scrollbar-hide"
            placeholder="How can Arrow help you today?"
          ></textarea>
          <Button className="bg-white -mt-20 text-black delay-50  hover:bg-black hover:text-white ">
            <MoveRight />
          </Button>
        </div>
        <div className=" ml-3 mb-2 p-2">
            <Link2 className="text-white"/>
        </div>
      </div>
    </div>
  );
}

export default Hero;
