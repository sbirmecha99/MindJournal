import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useJournal } from "../contexts/JournalContext";
import { FiUser, FiLock, FiTrash2, FiMail, FiShield } from "react-icons/fi";
import { IoColorPaletteOutline } from "react-icons/io5";
import { GoDatabase } from "react-icons/go";

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pin, setPin } = useJournal();

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleSetPin = (e) => {
    e.preventDefault();
    setPinError("");
    setPinSuccess("");

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError("PIN must be 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match.");
      return;
    }

    setPin(newPin);
    setPinSuccess("PIN has been updated successfully!");
    setNewPin("");
    setConfirmPin("");
  };

  const clearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to delete all your journal data? This action cannot be undone."
      )
    ) {
      // Clear journal entries
      localStorage.removeItem(`journal_entries_${user.id}`);

      // Keep the user logged in but refresh the page to clear state
      window.location.reload();
    }
  };

  const deleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? All your data will be permanently deleted. This action cannot be undone."
      )
    ) {
      // Get all users
      const users = JSON.parse(localStorage.getItem("users") || "[]");

      // Filter out current user
      const updatedUsers = users.filter((u) => u.id !== user.id);

      // Update users in localStorage
      localStorage.setItem("users", JSON.stringify(updatedUsers));

      // Remove journal entries
      localStorage.removeItem(`journal_entries_${user.id}`);

      // Log out the user
      logout();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 backdrop-blur-md px-4 py-4 rounded-xl shadow-inner">
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-libre-baskerville font-bold text-neutral-900 dark:text-white">
            <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <span className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-400  opacity-20 rounded-full animate-pulse"></span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-5 py-4">
          <SectionHeader
            icon={
              <FiUser
                className="text-white drop-shadow-[0_0_3px_rgba(16,185,129,0.7)] w-5 h-5"
                aria-hidden="true"
              />
            }
            title={
              <h2 className="text-lg font-lora font-bold">Account Settings</h2>
            }
            className="flex items-center gap-3"
          />

          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center text-[16px] font-lora font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                <FiUser className="mr-2" aria-hidden="true" />
                Name
              </div>
              <div className="font-libre-baskerville font-medium text-neutral-800 dark:text-white">
                {user.name}
              </div>
            </div>

            <div>
              <div className="flex items-center text-[16px] font-lora font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                <FiMail className="mr-2" aria-hidden="true" />
                Email
              </div>
              <div className="font-libre-baskerville font-medium text-neutral-800 dark:text-white">
                {user.email}
              </div>
            </div>

            <div>
              <div className="flex items-center text-[16px] font-lora font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                <FiLock className="mr-2" aria-hidden="true" />
                Password
              </div>
              <div className="font-libre-baskerville font-medium text-neutral-800 dark:text-white">
                ••••••••
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-outline w-full font-libre-baskerville font-bold transition-shadow focus:outline-none focus:ring-2 focus:ring-primarbg-primary-500"
              type="button"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-5 py-4">
          <SectionHeader
            icon={<IoColorPaletteOutline />}
            title={<h2 className="text-lg font-lora font-bold">Appearance</h2>}
            className="flex items-center gap-3"
          />

          <div className="p-6 flex justify-between items-center">
            <div>
              <div className="font-libre-baskerville font-medium text-neutral-800 dark:text-white mb-1">
                Theme
              </div>
              <div className="text-[15px] font-lora font-light text-neutral-600 dark:text-neutral-400">
                {theme === "dark" ? "Dark mode is on" : "Light mode is on"}
              </div>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="relative inline-flex h-6 w-11 rounded-full bg-neutral-300 dark:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-primarbg-primary-500"
              type="button"
            >
              <span
                className={`inline-block h-4 w-4 mt-1 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out
              ${
                theme === "dark"
                  ? "translate-x-6 bg-primary-500"
                  : "translate-x-1"
              }`}
              />
            </button>
          </div>
        </div>

        {/* Vault Settings */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-5 py-4">
          <SectionHeader
            icon={
              <FiShield
                className="text-white drop-shadow-[0_0_3px_rgba(16,185,129,0.7)] w-5 h-5"
                aria-hidden="true"
              />
            }
            title={
              <h2 className="text-lg font-lora font-bold">Vault Settings</h2>
            }
            className="flex items-center gap-3"
          />

          <form onSubmit={handleSetPin} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {pin ? "Change Vault PIN" : "Set Vault PIN"}
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                Set a 4-digit PIN to secure your private journal entries.
              </p>
              <input
                type="password"
                placeholder="New 4-digit PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength="4"
                className="input w-full focus:ring-primarbg-primary-500 focus:border-primarbg-primary-500 transition"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength="4"
                className="input w-full focus:ring-primarbg-primary-500 focus:border-primarbg-primary-500 transition"
              />
            </div>

            {pinError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {pinError}
              </p>
            )}
            {pinSuccess && (
              <p className="text-sm text-primarbg-primary-500 dark:text-primary-400">
                {pinSuccess}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full font-libre-baskerville font-bold transition-shadow focus:outline-none focus:ring-2 focus:ring-primarbg-primary-500"
            >
              {pin ? "Update PIN" : "Save PIN"}
            </button>
          </form>
        </div>

        {/* Data Management */}
        <div className="px-5 py-4">
          <SectionHeader
            icon={<GoDatabase />}
            title={
              <h2 className="text-lg font-lora font-bold">Data Management</h2>
            }
            className="flex items-center gap-3"
          />

          <div className="p-6 space-y-4">
            <button
              onClick={clearAllData}
              className="btn w-full border border-red-400 dark:border-red-700 text-red-600 dark:text-red-400 font-libre-baskerville font-medium
            shadow-[0_0_8px_0_rgba(220,38,38,0.6)] hover:shadow-[0_0_10px_2px_rgba(220,38,38,0.8)] transition-shadow focus:outline-none focus:ring-2 focus:ring-red-600"
              type="button"
            >
              Clear All Journal Data
            </button>
            <p className="mt-2 text-[15px] font-lora font-light text-neutral-500 dark:text-neutral-400">
              This will delete all your journal entries but keep your account.
            </p>

            <button
              onClick={() => setShowConfirmDelete(true)}
              className="btn w-full border border-red-400 dark:border-red-700 text-red-600 dark:text-red-400 flex items-center justify-center font-libre-baskerville font-medium
            shadow-[0_0_8px_0_rgba(220,38,38,0.6)] hover:shadow-[0_0_10px_2px_rgba(220,38,38,0.8)] transition-shadow focus:outline-none focus:ring-2 focus:ring-red-600"
              type="button"
            >
              <FiTrash2 className="mr-2" size={16} />
              Delete Account
            </button>
            <p className="mt-2 text-[15px] font-lora font-light text-neutral-500 dark:text-neutral-400">
              This will permanently delete your account and all associated data.
            </p>

            <AnimatePresence>
              {showConfirmDelete && (
                <motion.div
                  className="mt-4 p-4 border-4 border-red-600 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg
              shadow-[0_0_15px_4px_rgba(220,38,38,0.7)]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-libre-baskerville text-red-800 dark:text-red-200 font-medium mb-3">
                    Are you sure you want to delete your account?
                  </p>
                  <p className="font-lora text-red-700 dark:text-red-300 text-sm mb-4">
                    This action is permanent and cannot be undone. All your data
                    will be lost.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={deleteAccount}
                      className="font-lora btn bg-red-600 hover:bg-red-700 text-white transition-shadow focus:outline-none focus:ring-2 focus:ring-red-600"
                      type="button"
                    >
                      Yes, delete my account
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="btn btn-outline font-lora transition-shadow focus:outline-none focus:ring-2 focus:ring-primarbg-primary-500"
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

const SectionHeader = ({ icon, title }) => (
  <motion.div
    className="flex items-center space-x-2 mb-6 cursor-default select-none"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="w-8 h-8 rounded text-white text-[22px] bg-primary-600 flex items-center justify-center">
      {icon || <span className="text-white font-playwrite font-bold">M</span>}
    </div>
    <h2 className="text-lg font-lora font-bold text-neutral-800 dark:text-white">
      {title}
    </h2>
  </motion.div>
);
