"use client";

import { useState } from "react";

interface SignerPortProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
}

export default function SignerPortModal({ isOpen, onClose, onSubmit }: SignerPortProps) {
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1 || num > 65535) {
      setError("Please enter a valid port number (1-65535).");
      return;
    }
    setError("");
    onSubmit(num);
    setValue("");
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Allow empty string or valid number only
    if (newValue === "" || /^\d+$/.test(newValue)) {
      setValue(newValue);
      setError(""); // clear error while typing
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Enter the Port in which your signer is hosted:</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            value={value}
            onChange={handleChange}
            placeholder="Enter Port Number"
            min={1}
            max={65535}
            className={`w-full border ${error ? "border-red-500" : "border-gray-300"
              } rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none`}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
