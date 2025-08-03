import React, { useState } from 'react';

export default function GratitudeEntry({ onSubmit }) {
  const [items, setItems] = useState(["", "", ""]);

  const handleChange = (index, value) => {
    const updated = [...items];
    updated[index] = value;
    setItems(updated);
  };

  const handleSave = () => {
    if (items.some(item => item.trim() !== "")) {
      onSubmit(items);
      setItems(["", "", ""]);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-2">🙏 What are you grateful for today?</h2>
      {items.map((item, idx) => (
        <input
          key={idx}
          type="text"
          placeholder={`Thing #${idx + 1}`}
          value={item}
          onChange={(e) => handleChange(idx, e.target.value)}
          className="w-full p-2 mb-2 rounded border border-gray-300 dark:border-gray-600"
        />
      ))}
      <button
        onClick={handleSave}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Save
      </button>
    </div>
  );
}
