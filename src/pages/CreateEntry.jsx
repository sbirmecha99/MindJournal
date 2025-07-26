import { useNavigate } from 'react-router-dom'
import { useJournal } from '../contexts/JournalContext'
import EntryForm from '../components/journal/EntryForm'
import { useState, useRef } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const CreateEntry = () => {
  const { addEntry } = useJournal()
  const navigate = useNavigate()
  const [listening, setListening] = useState(false);
  
  const handleSubmit = (formData) => {
    const newEntry = addEntry(formData)
    navigate(`/journal/${newEntry.id}`)
  }
  const handleVoiceInput = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev) => ({
        ...prev,
        content: prev.content + " " + transcript,
      }));
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };
  
  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
        New Journal Entry
      </h1>

      <div className="card p-6">
        <EntryForm onSubmit={handleSubmit} />
        <button
          type="button"
          onClick={handleVoiceInput}
          className="btn btn-outline mt-2"
        >
          {listening ? "Listening..." : "🎙️ Record Voice"}
        </button>
      </div>
    </div>
  );
}

export default CreateEntry