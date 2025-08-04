import { Link } from "react-router-dom";
import { useJournal } from "../../contexts/JournalContext";
import { format } from "date-fns";
import MoodIcon from "../journal/MoodIcon";

const RecentEntries = () => {
  const { entries, privateEntryIds } = useJournal();
  const publicEntries = entries.filter(
    (entry) => !privateEntryIds.includes(entry.id)
  );
  const recentEntries = publicEntries.slice(0, 6);

  if (publicEntries.length === 0) {
    return (
      <div className="card p-4">
        <h2 className="text-lg font-medium mb-4">Recent Entries</h2>
        <div className="text-center py-8">
          <p className="font-lora text-[16px] text-neutral-500 dark:text-neutral-400 mb-4">
            No journal entries yet.
          </p>
          <Link
            to="/journal/new"
            className="btn btn-primary inline-block font-lora text-[15px]"
          >
            Create your first entry!
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-lora font-semibold">Recent Entries</h2>
        <Link
          to="/journal"
          className="font-lora font-medium text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          View all
        </Link>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {recentEntries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>

      {/* New Entry Button */}
      <div className="mt-6">
        <Link to="/journal/new" className="btn btn-primary w-full font-lora">
          New Journal Entry
        </Link>
      </div>
    </div>
  );
};

// Mood-based hover styles
const getMoodHover = (mood) => {
  switch (mood) {
    case "great":
      return "hover:border-emerald-400 hover:shadow-emerald-300/40";
    case "good":
      return "hover:border-blue-400 hover:shadow-blue-300/40";
    case "okay":
      return "hover:border-slate-400 hover:shadow-slate-300/40";
    case "bad":
      return "hover:border-amber-400 hover:shadow-amber-300/40";
    case "awful":
      return "hover:border-rose-400 hover:shadow-rose-300/40";
    default:
      return "hover:border-neutral-400 hover:shadow-neutral-300/40";
  }
};

// Reusable Card Component
const EntryCard = ({ entry }) => {
  return (
    <Link
      to={`/journal/${entry.id}`}
      className={`group rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${getMoodHover(
        entry.mood
      )}`}
    >
      {/* Date & Mood */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {format(new Date(entry.createdAt), "PPP")}
        </p>
        <div className="transform transition-transform duration-200 group-hover:scale-110">
          <MoodIcon mood={entry.mood} />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-libre-baskerville text-neutral-800 dark:text-neutral-100 font-medium text-lg truncate">
        {entry.title || "Untitled Entry"}
      </h3>

      {/* Preview */}
      <p className="font-lora text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2">
        {entry.content || "No content available"}
      </p>
    </Link>
  );
};

export default RecentEntries;
