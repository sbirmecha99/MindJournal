import { useState, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {motion} from "framer-motion";
import { useJournal } from "../contexts/JournalContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday,
  isSameMonth,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import SidePanel from "../components/calendar/SidePanel";

const Calendar = () => {
  const { entries, isLoading, privateEntryIds } = useJournal();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const calendarDays = useMemo(() => {
    if (isLoading || !entries) return [];

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const publicEntries = entries.filter(entry => !privateEntryIds.includes(entry.id));

    const entriesByDate = publicEntries.reduce((acc, entry) => {
      const date = parseISO(entry.createdAt);
      const dateStr = format(date, "yyyy-MM-dd");
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(entry);
      return acc;
    }, {});

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayEntries = entriesByDate[dateStr] || [];

        days.push({
          date: day,
          isCurrentMonth: isSameMonth(day, monthStart),
          isToday: isToday(day),
          entries: dayEntries,
        });

        day = addDays(day, 1);
      }
      rows.push(days);
      days = [];
    }

    return rows;
  }, [currentMonth, entries, isLoading]);

  const handleDayClick = (day) => {
    const today = new Date();
    const isPastOrToday = day.date <= today;

    if (!isPastOrToday) return;
    if (day.entries.length > 0 || day.isToday) {
      setSelectedDay(day);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 animate-fadeIn">
        {/* Skeleton UI as before */}
        <p className="text-center text-neutral-600 dark:text-neutral-300">
          Loading...
        </p>
      </div>

    );
  }

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 px-4 py-6 bg-neutral-900/60 backdrop-blur-xl rounded-2xl shadow-inner border border-neutral-700 animate-fadeIn">
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          selectedDay ? "opacity-40 blur-sm scale-[0.98] pointer-events-none" : "opacity-100 blur-0 scale-100"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-libre-baskerville font-bold  text-neutral-900 dark:text-white relative">
           <motion.span
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent"
        >
          Calendar
        </motion.span>
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 0.2, width: "100%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute left-0 bottom-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full animate-pulse"
        />
      </h1>

          <div className="flex space-x-2  items-center">
           <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1, backgroundColor: "rgba(20,184,166,0.3)" }}
          transition={{ duration: 0.2 }}
          onClick={prevMonth}
          className="p-2 rounded-full bg-neutral-800 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FiChevronLeft size={20} />
        </motion.button>
              <motion.button
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="px-4 py-2 text-neutral-300 hover:text-teal-400 transition-colors duration-200 relative"
          onClick={() => setCurrentMonth(new Date())}
        >
          {format(currentMonth, "MMMM yyyy")}
        </motion.button>

             <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1, backgroundColor: "rgba(20,184,166,0.3), boxShadow: 0 0 10px rgba(20,184,166,0.6)"}}
          transition={{ duration: 0.2 }}
          onClick={nextMonth}
          className="p-2 rounded-full bg-neutral-800 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FiChevronRight size={20} />
        </motion.button>
            <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(20,184,166,0.2)" }}
          transition={{ duration: 0.2 }}
          onClick={() => setCurrentMonth(new Date())}
          className="px-3 py-1 ml-2 rounded-lg bg-neutral-700 text-neutral-300 hover:text-white hover:shadow-md transition-all"
        >
          Today
        </motion.button>
      </div>
    </div>

        {/* Grid */}
        <div className="overflow-hidden rounded-2xl bg-neutral-800/50 backdrop-blur-md shadow-inner border border-neutral-700">
         <div className="grid grid-cols-1 md:grid-cols-7 border-b border-neutral-700 transition-all duration-300">

            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-3 font-libre-baskerville font-semibold text-neutral-300 uppercase text-[13px] tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

         <div className="grid grid-cols-7 md:grid-cols-7 grid-cols-1 border-b border-neutral-700 transition-all duration-300">
    {calendarDays.map((week, weekIndex) => (
      <Fragment key={weekIndex}>
        {week.map((day, dayIndex) => {
          const isPastOrToday = day.date <= new Date();
          const isClickable = (day.entries.length > 0 || day.isToday) && isPastOrToday;

          return (
                    <div
                      key={dayIndex}
                      onClick={
                        isClickable ? () => handleDayClick(day) : undefined
                      }
                      className={`group relative min-h-[100px] p-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0
                        ${
                          !day.isCurrentMonth
                            ? "bg-neutral-900/60 text-neutral-500"
                            : ""
                        }
                        ${
                          day.isToday
                            ? "ring-2 ring-teal-400/50 bg-teal-500/10 animate-pulse"
                            : ""
                        }
                        ${isClickable ? "cursor-pointer hover:ring-2 hover:ring-teal-400/50 hover:shadow-lg hover:shadow-teal-300/20" : "cursor-default"}

                        transition-all duration-300 rounded-xl  active:scale-95 hover:scale-[1.02]`}
                    >
                      <div className="flex justify-between items-start">
                        <div
                          className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-libre-baskerville font-semibold transition-all duration-200

                             ${
                            day.isToday
                              ? "bg-teal-500 text-white shadow-md ring-2 ring-teal-300/40 animate-glow"
                              : isClickable
                              ? "text-neutral-200 group-hover:bg-teal-500/20"
                              : "text-neutral-500"
                          }`}
                        >
                          {format(day.date, "d")}
                        </div>

                        {day.isToday && !day.entries.length && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/journal/new");
                            }}
                            className="p-1 rounded-full bg-neutral-700 text-neutral-400 hover:bg-neutral-600 transition-colors"
                          >
                            <FiPlus size={14} />
                          </button>
                        )}
                      </div>

                      {day.entries.length > 0 && (
                        <div className="mt-2 flex justify-center">
                         <div className="text-xs px-2 py-1 rounded-full bg-teal-500 text-white font-libre-baskerville font-light shadow-md group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-teal-400/40 transition-all">

                            {day.entries.length}{" "}
                            {day.entries.length === 1 ? "Entry" : "Entries"}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <SidePanel
        isOpen={!!selectedDay}
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
};

export default Calendar;
