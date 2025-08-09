import { useState, useEffect, useRef, useCallback } from "react";
import { useJournal } from "../../contexts/JournalContext";
import {
  Check,
  Smile,
  Meh,
  Frown,
  UploadCloud,
  XCircle,
  Loader2,
  Trash2,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  FaRunning,
  FaBookOpen,
  FaPrayingHands,
  FaBriefcase,
  FaUsers,
} from "react-icons/fa";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Modal from "../common/Modal";
import { useNavigate } from "react-router-dom";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const moods = [
  {
    id: "great",
    label: "Epic",
    icon: <Smile className="text-green-500" size={24} />,
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  },
  {
    id: "good",
    label: "Good",
    icon: <Smile className="text-blue-500" size={24} />,
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  },
  {
    id: "okay",
    label: "Okay",
    icon: <Meh className="text-yellow-500" size={24} />,
    color:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
  },
  {
    id: "bad",
    label: "Bad",
    icon: <Meh className="text-orange-500" size={24} />,
    color:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  },
  {
    id: "awful",
    label: "Awful",
    icon: <Frown className="text-red-500" size={24} />,
    color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
  },
];

const EntryForm = ({ onSubmit, initialData = {} }) => {
  const { setActiveEntry, privateEntryIds, togglePrivacy } = useJournal();
  const [isPrivate, setIsPrivate] = useState(false);
  const [entryData, setEntryData] = useState({
    title: "",
    content: "",
    mood: "",
    activities: [],
    images: [],
    micro_goals: [],
    ...initialData,
  });

  const [newActivityInput, setNewActivityInput] = useState("");
  const [imagePreviews, setImagePreviews] = useState(initialData.images || []);
  const [microGoalPreview, setMicroGoalPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [isAiSupportEnabled, setIsAiSupportEnabled] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const suggestionDivRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  //Audio Recording
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);
  const analyserRef = useRef(null);

  const handleScroll = () => {
    if (textareaRef.current && suggestionDivRef.current) {
      suggestionDivRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Init speech recognition if supported
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setEntryData((prev) => ({
          ...prev,
          content: prev.content + " " + transcript,
        }));
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        alert("Speech recognition error: " + err.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechToText = () => {
    if (!SpeechRecognition) {
      alert("Speech-to-text is not supported in this browser. Try Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  // 🎤 Audio Recording
  const toggleAudioRecording = async () => {
    if (isRecordingAudio) {
      mediaRecorderRef.current.stop();
      cancelAnimationFrame(animationIdRef.current);
      setIsRecordingAudio(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioURL = URL.createObjectURL(audioBlob);
        console.log("Recorded Audio URL:", audioURL);
        // You can store this URL or upload audioBlob to server
      };

      // Waveform setup
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const drawWaveform = () => {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#3b82f6";
        ctx.beginPath();

        let sliceWidth = (canvas.width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          let v = dataArray[i] / 128.0;
          let y = (v * canvas.height) / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        animationIdRef.current = requestAnimationFrame(drawWaveform);
      };
      drawWaveform();

      mediaRecorderRef.current.start();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error("Audio recording error:", err);
      alert("Unable to access microphone.");
    }
  };

  useEffect(() => {
    if (initialData.id) {
      setIsPrivate(privateEntryIds.includes(initialData.id));
    }
  }, [initialData, privateEntryIds]);

  const commonActivities = [
    { label: "Exercise", icon: <FaRunning className="text-red-500" /> },
    { label: "Reading", icon: <FaBookOpen className="text-blue-500" /> },
    {
      label: "Meditation",
      icon: <FaPrayingHands className="text-purple-500" />,
    },
    { label: "Work", icon: <FaBriefcase className="text-yellow-500" /> },
    { label: "Family", icon: <FaUsers className="text-green-500" /> },
  ];

  const navigate = useNavigate();

  const fetchAiSuggestion = useCallback(
    async (currentContent) => {
      if (!isAiSupportEnabled || !currentContent) return;
      setIsAiLoading(true);
      setAiSuggestion("");

      try {
        const genAI = new GoogleGenerativeAI(
          import.meta.env.VITE_GEMINI_API_KEY
        );
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an AI writing assistant helping a user write a journal entry. Continue the entry based on the provided context. Keep the suggestion concise (one or two sentences) and relevant.
      
      **Context:**
      - **Title:** ${entryData.title || "Not specified"}
      - **Mood:** ${entryData.mood || "Not specified"}
      - **Activities:** ${entryData.activities?.join(", ") || "None"}
      - **Goals:** ${
        entryData.micro_goals?.map((g) => g.text).join(", ") || "None"
      }

      **Journal so far:**
      ---
      ${currentContent}
      ---
      
      **Your continuation suggestion:**`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const suggestion = response.text().trim();

        if (suggestion) {
          setAiSuggestion(suggestion.split("\n")[0]); // Use only the first line for a clean suggestion
        }
      } catch (error) {
        console.error("AI suggestion fetch failed:", error);
      } finally {
        setIsAiLoading(false);
      }
    },
    [
      isAiSupportEnabled,
      entryData.title,
      entryData.mood,
      entryData.activities,
      entryData.micro_goals,
    ]
  );

  const debouncedFetchAiSuggestion = useCallback(
    (content) => {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        fetchAiSuggestion(content);
      }, 1000); // 1-second debounce
    },
    [fetchAiSuggestion]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEntryData((prev) => ({ ...prev, [name]: value }));

    if (name === "content" && isAiSupportEnabled) {
      debouncedFetchAiSuggestion(value);
    }
  };

  const handleMoodSelection = (moodId) => {
    setEntryData((prev) => ({ ...prev, mood: moodId }));
  };

  const toggleActivitySelection = (activity) => {
    setEntryData((prev) => {
      const currentActivities = prev.activities || [];
      return {
        ...prev,
        activities: currentActivities.includes(activity)
          ? currentActivities.filter((a) => a !== activity)
          : [...currentActivities, activity],
      };
    });
  };

  const addCustomActivity = () => {
    if (
      newActivityInput.trim() &&
      !entryData.activities.includes(newActivityInput.trim())
    ) {
      setEntryData((prev) => ({
        ...prev,
        activities: [...(prev.activities || []), newActivityInput.trim()],
      }));
      setNewActivityInput("");
    }
  };

  const addMicroGoal = () => {
    if (
      microGoalPreview.trim() &&
      !entryData.micro_goals.includes(microGoalPreview.trim())
    ) {
      setEntryData((prev) => ({
        ...prev,
        micro_goals: [
          ...(prev.micro_goals || []),
          {
            text: microGoalPreview.trim(),
            is_completed: false,
          },
        ],
      }));
      setMicroGoalPreview("");
    }
  };

  const removeMicroGoal = (index) => {
    setEntryData((prev) => {
      const newMicroGoals = prev.micro_goals.filter((goal, i) => i !== index);
      return { ...prev, micro_goals: newMicroGoals };
    });
  };

  const toggleMicroGoalCompletion = (index) => {
    setEntryData((prev) => {
      const newMicroGoals = prev.micro_goals.map((goal, i) => {
        if (i === index) {
          return { ...goal, is_completed: !goal.is_completed };
        }
        return goal;
      });
      return { ...prev, micro_goals: newMicroGoals };
    });
  };

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setEntryData((prev) => ({
        ...prev,
        images: [...prev.images, ...files],
      }));
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    const imageToRemove = entryData.images[index];
    if (imageToRemove instanceof File) {
      const previewToRemove = imagePreviews[index];
      URL.revokeObjectURL(previewToRemove);
    }
    setEntryData((prev) => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleSaveEntry = async (quote) => {
    setIsSubmitting(true);
    const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;
    const existingImageUrls = entryData.images.filter(
      (image) => typeof image === "string"
    );
    const newImageFiles = entryData.images.filter(
      (image) => image instanceof File
    );
    const uploadedImageUrls = [];
    const uploadPromises = newImageFiles.map(async (image) => {
      const data = new FormData();
      data.append("file", image);
      data.append("upload_preset", UPLOAD_PRESET);
      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: data,
          }
        );
        const file = await res.json();
        if (file.secure_url) {
          uploadedImageUrls.push(file.secure_url);
        }
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    });
    await Promise.all(uploadPromises);
    const finalEntryData = {
      ...entryData,
      images: [...existingImageUrls, ...uploadedImageUrls],
    };

    const savedEntry = await onSubmit(finalEntryData, quote);

    const currentlyIsPrivate = privateEntryIds.includes(savedEntry.id);
    if (isPrivate !== currentlyIsPrivate) {
      togglePrivacy(savedEntry.id);
    }

    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsQuoteLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a wise and empathetic companion. Based on the following journal entry written with a mood of '${entryData.mood}', please generate one short, original, and insightful quote (no more than 20 words) that captures the core theme or feeling of the text. Do not explain or add any extra text. Just provide the quote. Entry: "${entryData.content}"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const quote = response.text().trim().replace(/"/g, "");

      setGeneratedQuote(quote);
      setIsModalOpen(true);
    } catch (error) {
      console.error(
        "Failed to generate quote, saving entry without it.",
        error
      );
      handleSaveEntry(null);
    } finally {
      setIsQuoteLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    handleSaveEntry(generatedQuote);
  };

  const closeEntryForm = () => {
    setIsFormOpen(false);
    navigate("/journal");
  };

  useEffect(() => {
    setActiveEntry(entryData);
  }, [entryData, setActiveEntry]);

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="A Thought for You"
        position="bottom"
      >
        <div className="text-center p-4">
          <p className="text-xl italic text-neutral-700 dark:text-neutral-300 mb-6">
            "{generatedQuote}"
          </p>
          <button onClick={handleCloseModal} className="btn btn-primary w-full">
            Save Entry and Continue
          </button>
        </div>
      </Modal>
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6 md:p-8 bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl shadow-2xl"
        >
          <div>
            <label
              htmlFor="title"
              className="block text-[16px] font-libre-baskerville font-semibold text-neutral-800 dark:text-neutral-200 mb-3"
            >
              Entry Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={entryData.title}
              onChange={handleInputChange}
              required
              className="font-lora font-light text-[16px] w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 transition-colors duration-200"
              placeholder="Give your journal entry a title"
            />
          </div>

          <div className="pt-3">
            <label className="block text-[16px] font-libre-baskerville font-semibold  text-neutral-800 dark:text-neutral-200 mb-3">
              How are you feeling today? <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleMoodSelection(mood.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ease-in-out text-[15px] font-lora font-light ${
                    entryData.mood === mood.id
                      ? mood.color +
                        " ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-neutral-900 shadow-md"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  <span>{mood.icon}</span>
                  <span>{mood.label}</span>
                  {entryData.mood === mood.id && (
                    <Check
                      className="ml-1 text-primary-600 dark:text-primary-400"
                      size={16}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <label className="block text-[14px] font-libre-baskerville font-semibold  text-neutral-800 dark:text-neutral-200 mb-3">
              Activities (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {commonActivities.map(({ label, icon }) => {
                const isSelected = entryData.activities?.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleActivitySelection(label)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                      isSelected
                        ? "bg-primary-100/50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 ring-2 ring-primary-400 dark:ring-primary-600 border-primary-400 shadow-sm"
                        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    {icon}
                    <span className="font-lora font-light text-[15px]">
                      {label}
                    </span>
                    {isSelected && (
                      <span className="ml-1 text-green-500">✅</span>
                    )}
                  </button>
                );
              })}
              {entryData.activities
                ?.filter((a) => !commonActivities.some((ca) => ca.label === a))
                .map((activity) => (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => toggleActivitySelection(activity)}
                    className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 px-3 py-1.5 text-sm rounded-full ring-1 ring-primary-400"
                  >
                    {activity}
                  </button>
                ))}
            </div>
            <div className="flex rounded-lg shadow-sm">
              <input
                type="text"
                value={newActivityInput}
                onChange={(e) => setNewActivityInput(e.target.value)}
                className="font-lora font-light text-[15px] flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 transition-colors duration-200"
                placeholder="Add a new activity (e.g., 'Gardening')"
              />
              <button
                type="button"
                onClick={addCustomActivity}
                disabled={!newActivityInput.trim()}
                className="px-5 py-2 font-lora font-semibold text-[15px] ml-2 space-x-1 rounded-lg  text-white bg-primary-600 hover:bg-primary-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          <div className="pt-3">
            <label className="block text-[14px] font-libre-baskerville font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
              Goals (optional)
            </label>
            <div className="flex rounded-lg shadow-sm">
              <input
                type="text"
                value={microGoalPreview}
                onChange={(e) => setMicroGoalPreview(e.target.value)}
                className="font-lora font-light text-[15px] flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 transition-colors duration-200"
                placeholder="Add new Goal (e.g., Sleep before 11 PM)"
              />
              <button
                type="button"
                onClick={addMicroGoal}
                className="px-4 py-2 font-lora font-semibold text-[15px] ml-2 space-x-1 rounded-lg  bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors duration-200 disabled:opacity-50"
                disabled={!microGoalPreview.trim()}
              >
                Add
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {entryData.micro_goals?.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => toggleMicroGoalCompletion(index)}
                      className={`w-4 h-4 cursor-pointer rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                        goal.is_completed
                          ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500"
                          : "bg-white dark:bg-neutral-700 border-gray-300 dark:border-gray-500 hover:border-primary-400 dark:hover:border-primary-400"
                      }`}
                    >
                      {goal.is_completed && (
                        <Check
                          strokeWidth={5}
                          className="w-4 h-4 font-bold text-white"
                        />
                      )}
                    </div>
                    <span
                      className={`text-md font-lora ${
                        goal.is_completed
                          ? "line-through text-gray-400"
                          : "font-lora text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {goal.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMicroGoal(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <label className="block text-[14px] font-libre-baskerville font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
              Attach Images (optional)
            </label>
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 dark:border-neutral-700 border-dashed rounded-lg transition-all duration-200 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10">
              <div className="space-y-2 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-neutral-400" />
                <div className="flex text-sm text-neutral-600 dark:text-neutral-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-transparent rounded-md font-libre-baskerville font-semibold text-[13px]  text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={handleImageFileChange}
                      accept="image/png, image/jpeg"
                    />
                  </label>
                  <p className="pl-1 font-libre-baskerville text-[13px]">
                    or drag and drop
                  </p>
                </div>
                <p className="text-[14px] font-lora font-semibold text-neutral-500 dark:text-neutral-500">
                  PNG, JPG up to 5MB each
                </p>
              </div>
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`preview ${index}`}
                      className="h-28 w-full object-cover rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 transition-transform duration-300 ease-in-out group-hover:scale-[1.02]"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 backdrop-blur-md shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                      aria-label="Remove image"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3">
            <label
              htmlFor="content"
              className="flex items-center justify-between text-[16px] font-libre-baskerville font-semibold text-neutral-800 dark:text-neutral-200 mb-3"
            >
              <span>
                Journal Entry <span className="text-red-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAiSupportEnabled(!isAiSupportEnabled)}
                className={`flex items-center gap-2 px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                  isAiSupportEnabled
                    ? "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 ring-1 ring-primary-400"
                    : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                }`}
              >
                <Sparkles
                  size={14}
                  className={isAiSupportEnabled ? "text-primary-500" : ""}
                />
                AI Support {isAiSupportEnabled ? "ON" : "OFF"}
              </button>
            </label>
            <div className="relative h-[220px]">
              {/* AI suggestion preview */}
              <div
                ref={suggestionDivRef}
                className="font-lora font-light text-[16px] w-full h-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words overflow-auto pointer-events-none absolute top-0 left-0 z-0"
              >
                {entryData.content}
                <span className="text-neutral-400 dark:text-neutral-500">
                  {isAiLoading ? "..." : aiSuggestion}
                </span>
              </div>

              {/* Speech-to-text & Audio Recording controls */}
              <div className="flex items-center gap-3 mb-2 relative z-10">
                {/* 🎤 Speech-to-text */}
                <button
                  type="button"
                  onClick={toggleSpeechToText}
                  className={`px-3 py-1 rounded-full text-sm ${
                    isListening
                      ? "bg-red-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {isListening ? "Stop Dictation" : "🎤 Speak"}
                </button>

                {/* 🔴 Audio Recording */}
                <button
                  type="button"
                  onClick={toggleAudioRecording}
                  className={`px-3 py-1 rounded-full text-sm ${
                    isRecordingAudio
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {isRecordingAudio ? "Stop Recording" : "🔴 Record Audio"}
                </button>
              </div>

              {/* Waveform Canvas */}
              {isRecordingAudio && (
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={60}
                  className="border border-neutral-300 rounded-md mb-2 relative z-10"
                />
              )}

              {/* Main textarea */}
              <textarea
                ref={textareaRef}
                id="content"
                name="content"
                value={entryData.content}
                onChange={handleInputChange}
                onScroll={handleScroll}
                onKeyDown={(e) => {
                  if (e.key === "Tab" && aiSuggestion) {
                    e.preventDefault();
                    setEntryData((prev) => ({
                      ...prev,
                      content: prev.content + aiSuggestion,
                    }));
                    setAiSuggestion("");
                  }
                }}
                required
                className="font-lora font-light text-[16px] w-full h-full px-4 py-2 border border-transparent rounded-lg bg-transparent text-transparent placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm resize-none relative z-10 caret-neutral-900 dark:caret-neutral-100"
                placeholder="Write your thoughts and experiences here..."
              />
            </div>

            <div className="mt-4 p-3 border border-neutral-300 dark:border-neutral-700 rounded-md bg-neutral-50 dark:bg-neutral-900 text-[14px] font-lora font-light prose dark:prose-invert max-w-none  break-words">
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked(entryData.content || "")),
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <div className="flex items-center gap-3">
                <Shield className="text-neutral-500" />
                <div>
                  <label
                    htmlFor="isPrivate"
                    className="font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    Save to Vault
                  </label>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    This entry will be PIN-protected.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPrivate}
                onClick={() => setIsPrivate(!isPrivate)}
                className={`${
                  isPrivate
                    ? "bg-primary-600"
                    : "bg-neutral-300 dark:bg-neutral-600"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    isPrivate ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-2 gap-4">
            <button
              onClick={closeEntryForm}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-lora font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-900 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-lora font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-900 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
              disabled={isSubmitting || isQuoteLoading}
            >
              {isQuoteLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Finding a thought for you...</span>
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="animate-pulse">
                    {initialData.id ? "Saving..." : "Creating..."}
                  </span>
                </>
              ) : initialData.id ? (
                "💾 Save Changes"
              ) : (
                "📝 Create Entry"
              )}
            </button>
          </div>
        </form>
      )}
    </>
  );
};

export default EntryForm;
