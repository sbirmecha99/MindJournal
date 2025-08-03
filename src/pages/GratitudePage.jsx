import { useState, useEffect, useMemo } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

const GratitudePage = () => {
  const [entries, setEntries] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("gratitudeEntries"));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const [gratitudes, setGratitudes] = useState(["", "", ""]);

  // Save entries to localStorage on update
  useEffect(() => {
    localStorage.setItem("gratitudeEntries", JSON.stringify(entries));
  }, [entries]);

  const handleSubmit = () => {
    if (gratitudes.every((item) => item.trim() === "")) return;

    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      items: [...gratitudes],
    };
    setEntries((prev) => [newEntry, ...prev]);
    setGratitudes(["", "", ""]);
  };

  const deleteEntry = (id) => {
    if (confirm("Are you sure you want to delete this gratitude entry?")) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const filteredEntries = useMemo(() => {
    return entries;
  }, [entries]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="sticky top-4 z-10 bg-white dark:bg-neutral-900/90 backdrop-blur-lg rounded-xl shadow-sm px-4 py-2 mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4 md:gap-8">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h1 className="text-2xl font-libre-baskerville font-bold text-neutral-800 dark:text-white">
              🙏 Gratitude Journal
            </h1>
            <p className="font-lora text-neutral-600 dark:text-neutral-400 mt-1">
              ({entries.length} {entries.length === 1 ? "entry" : "entries"})
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="card p-4 space-y-4">
        <h2 className="font-lora font-medium text-lg">
          Today I’m grateful for...
        </h2>
        {gratitudes.map((value, index) => (
          <input
            key={index}
            type="text"
            className="input w-full"
            placeholder={`Thing ${index + 1}`}
            value={value}
            onChange={(e) =>
              setGratitudes((prev) => {
                const updated = [...prev];
                updated[index] = e.target.value;
                return updated;
              })
            }
          />
        ))}
        <button
          onClick={handleSubmit}
          className="btn btn-primary flex items-center space-x-2 rounded-xl"
        >
          <FiPlus />
          <span>Save Gratitude</span>
        </button>
      </div>

      {/* Entry List */}
      <AnimatePresence>
        {filteredEntries.length > 0 ? (
          <div className="mt-6 space-y-4">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                className="card p-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-libre-baskerville font-medium text-neutral-800 dark:text-white">
                    {entry.date}
                  </h3>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-500"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <ul className="list-disc pl-5 text-neutral-700 dark:text-neutral-200 font-lora space-y-1">
                  {entry.items.map((item, idx) =>
                    item.trim() ? <li key={idx}>{item}</li> : null
                  )}
                </ul>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-8 mt-6 text-center rounded-xl shadow-sm">
            <h3 className="text-lg font-libre-baskerville font-medium text-neutral-800 dark:text-white mb-2">
              No entries yet!
            </h3>
            <p className="font-lora text-sm text-neutral-600 dark:text-neutral-400">
              Start by writing down three things you're grateful for today.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GratitudePage;
