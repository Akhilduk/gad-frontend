// components/AccessibilityToolbar.js
import { useState } from "react";
import {
  AdjustmentsHorizontalIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  ComputerDesktopIcon,
  Squares2X2Icon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export function AccessibilityToolbar() {
 
  const [filter, setFilter] = useState("none");
 
  const handleFontSize = (size: string) => {
    
    document.documentElement.style.fontSize = size;
  };

type FilterType = "normal" | "grayscale" | "invert";

const handleFilter = (type: FilterType) => {
  let filterValue: string;
  switch (type) {
    case "normal":
      filterValue = "none";
      break;
    case "grayscale":
      filterValue = "grayscale(100%)";
      break;
    case "invert":
      filterValue = "invert(100%)";
      break;
    default:
      filterValue = "none";
  }
  setFilter(filterValue);
  document.body.style.filter = filterValue;
};

  return (
    <div className="flex justify-center space-x-4">
      {/* Font Size Controls */}
      <button
        className="text-neutral-400 hover:text-neutral-100 focus:outline-none"
        onClick={() => handleFontSize("20px")}
      >
        <PlusCircleIcon className="w-6 h-6" />
      </button>
      <button
        className="text-neutral-400 hover:text-neutral-100 focus:outline-none"
        onClick={() => handleFontSize("16px")}
      >
        <AdjustmentsHorizontalIcon className="w-6 h-6" />
      </button>
      <button
        className="text-neutral-400 hover:text-neutral-100 focus:outline-none"
        onClick={() => handleFontSize("12px")}
      >
        <MinusCircleIcon className="w-6 h-6" />
      </button>

      {/* Filter Controls */}
      {/* <button
        className={`text-neutral-400 hover:text-neutral-100 focus:outline-none ${
          filter === "none" ? "text-black" : ""
        }`}
        onClick={() => handleFilter("normal")}
      >
        <ComputerDesktopIcon className="w-6 h-6" />
      </button>
      <button
        className={`text-neutral-400 hover:text-neutral-100 focus:outline-none ${
          filter === "grayscale(100%)" ? "text-black" : ""
        }`}
        onClick={() => handleFilter("grayscale")}
      >
        <Squares2X2Icon className="w-6 h-6" />
      </button>
      <button
        className={`text-neutral-400 hover:text-neutral-100 focus:outline-none ${
          filter === "invert(100%)" ? "text-black" : ""
        }`}
        onClick={() => handleFilter("invert")}
      >
        <ArrowPathIcon className="w-6 h-6" />
      </button> */}
    </div>
  );
}
