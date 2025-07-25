import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { FaExclamationCircle, FaPaperPlane, FaRedo } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ChatInterface = ({ userId }) => {
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [issueMessage, setIssueMessage] = useState("");
  const [chatEnded, setChatEnded] = useState(false);
  const [sessionReport, setSessionReport] = useState(null);
  const [showExperienceRating, setShowExperienceRating] = useState(false);
  const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState(false);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);
  const [feedbackQuestionId, setFeedbackQuestionId] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");

const startNewSession = () => {
  if (socketRef.current) {
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }

    // Reset all state
    setChatEnded(false);
    setCurrentQuestion(null);
    setMessages([]);
    setSessionReport(null);
    setShowExperienceRating(false);
    setShowFeedbackInput(false);
    setShowIssueReport(false);
    setIsLoadingNextQuestion(false);

    // Add error handling
    socketRef.current.emit("start-session", (response) => {
      if (response?.error) {
        setMessages(prev => [...prev, { 
          type: "system", 
          text: `Failed to start session: ${response.error.message}` 
        }]);
      }
    });
  }
};

  useEffect(() => {
    setSocketStatus("connecting");

    socketRef.current = io(import.meta.env.VITE_API_Base_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token },
    });

    socketRef.current.on("heartbeat-ping", (data) => {
      socketRef.current.emit("heartbeat-pong", { timestamp: data.timestamp });
    });

    socketRef.current.on("connection-status", (status) => {
      console.log("Connection status:", status);
    });
    // Connection events
    socketRef.current.on("connect", () => {
      setSocketStatus("connected");
      startNewSession();
    });

    socketRef.current.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socketRef.current.on("reconnect", () => {
      setSocketStatus("connected");
      startNewSession();
    });

    socketRef.current.on("reconnect_attempt", () => {
      setSocketStatus("reconnecting");
    });

    socketRef.current.on("reconnect_error", () => {
      setSocketStatus("disconnected");
    });

    socketRef.current.on("reconnect_failed", () => {
      setSocketStatus("disconnected");
    });

    // Session events
    socketRef.current.on("session-ended", ({ message }) => {
      setMessages((prev) => [...prev, { type: "bot", text: message }]);
      setChatEnded(true);
      setShowExperienceRating(false);
    });

    socketRef.current.on("session-interrupted", ({ message }) => {
      setMessages((prev) => [...prev, { type: "system", text: message }]);
      setChatEnded(true);
    });

    // Question handling
    socketRef.current.on("first-question", (question) => {
      setCurrentQuestion(question);
      setMessages((prev) => [...prev, { type: "bot", text: question.text }]);
      setIsLoadingNextQuestion(false);
    });

    socketRef.current.on("next-question", (question) => {
      if (question) {
        setCurrentQuestion(question);
        setMessages((prev) => [...prev, { type: "bot", text: question.text }]);
      }
      setIsLoadingNextQuestion(false);
    });

    socketRef.current.on("session-summary", (report) => {
      setSessionReport(report);
      setShowExperienceRating(true);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Thank you for answering all questions! How would you rate your overall experience with this chat?",
        },
      ]);
      setIsLoadingNextQuestion(false);
    });

    socketRef.current.on("thank-you", ({ message }) => {
      setMessages((prev) => [...prev, { type: "bot", text: message }]);
      setShowExperienceRating(false);
    });

    socketRef.current.on("request-feedback", ({ questionId }) => {
      setFeedbackQuestionId(questionId);
      setShowFeedbackInput(true);
    });
    socketRef.current.on("next-question", (question) => {
      if (question) {
        setCurrentQuestion(question);
        setMessages((prev) => [...prev, { type: "bot", text: question.text }]);
        setShowFeedbackInput(false);
        setFeedbackQuestionId(null);
      }
      setIsLoadingNextQuestion(false);
    });
    socketRef.current.on("appreciation", () => {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Thank you for your positive feedback! 😊" },
      ]);
    });

    socketRef.current.on("error", (error) => {
      setMessages((prev) => [
        ...prev,
        { type: "system", text: `Error: ${error.message}` },
      ]);
      setIsLoadingNextQuestion(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("reconnect");
        socketRef.current.off("reconnect_attempt");
        socketRef.current.off("reconnect_error");
        socketRef.current.off("reconnect_failed");
        socketRef.current.off("session-ended");
        socketRef.current.off("session-interrupted");
        socketRef.current.off("first-question");
        socketRef.current.off("next-question");
        socketRef.current.off("session-summary");
        socketRef.current.off("thank-you");
        socketRef.current.off("request-feedback");
        socketRef.current.off("appreciation");
        socketRef.current.off("error");

        if (socketRef.current.connected) {
          socketRef.current.disconnect();
        }
      }
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

const handleRating = (rating) => {
  // Don't set isLoadingNextQuestion here - we might need to show feedback first
  setMessages((prev) => [
    ...prev,
    {
      type: "user",
      text: `Rating: ${"⭐".repeat(rating)}${"☆".repeat(5 - rating)}`,
    },
  ]);

  setFeedback("");
  setFeedbackQuestionId(null);

  socketRef.current.emit("submit-response", {
    questionId: currentQuestion._id,
    rating,
    feedback: null,
  });

  if (rating > 2) {
    setIsLoadingNextQuestion(true);
  }
};

const handleFeedbackSubmit = () => {
  if (feedback.trim() && feedbackQuestionId) {
    setMessages((prev) => [
      ...prev,
      { type: "user", text: `Feedback: ${feedback.trim()}` },
    ]);

    socketRef.current.emit("submit-additional-feedback", {
      questionId: feedbackQuestionId,
      additionalFeedback: feedback.trim(),
    });

    setFeedback("");
    setShowFeedbackInput(false);
    setFeedbackQuestionId(null);

    // Set loading state when moving to next question
    setIsLoadingNextQuestion(true);
  }
};

  const handleExperienceRating = (rating) => {
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: `Overall Experience: ${"⭐".repeat(rating)}${"☆".repeat(
          5 - rating
        )}`,
      },
    ]);

    socketRef.current.emit("submit-experience-rating", { rating });
  };

  const handleIssueReport = () => {
    if (issueMessage.trim()) {
      setMessages((prev) => [
        ...prev,
        { type: "user", text: `Issue: ${issueMessage.trim()}` },
      ]);

      socketRef.current.emit("report-issue", {
        questionId: currentQuestion?._id,
        message: issueMessage.trim(),
      });

      setIssueMessage("");
      setShowIssueReport(false);
    }
  };

  const renderStatusIndicator = () => {
    const statusColors = {
      connecting: "bg-amber-400",
      connected: "bg-emerald-500",
      disconnected: "bg-rose-500",
      reconnecting: "bg-amber-400",
    };

    const statusText = {
      connecting: "Connecting...",
      connected: "Connected",
      disconnected: "Disconnected",
      reconnecting: "Reconnecting...",
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          statusColors[socketStatus] || "bg-gray-500"
        } text-white`}
      >
        <span className="w-2 h-2 mr-2 rounded-full bg-white/80"></span>
        {statusText[socketStatus] || socketStatus.toUpperCase()}
      </motion.div>
    );
  };

  const QuestionLoader = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 max-w-xs md:max-w-md shadow-sm w-full">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="flex justify-between mt-3">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              FB
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Feedback Bot</h2>
              <p className="text-xs text-gray-500">Always here to help</p>
            </div>
          </div>
          {renderStatusIndicator()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              transition={{ duration: 0.3 }}
              className={`flex ${
                message.type === "bot" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md rounded-2xl p-4 ${
                  message.type === "bot"
                    ? "bg-white border border-gray-200 rounded-tl-none"
                    : message.type === "system"
                    ? "bg-gray-100 border border-gray-200 rounded-tr-none"
                    : "bg-indigo-500 text-white rounded-tr-none"
                } shadow-sm`}
              >
                {message.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!chatEnded && isLoadingNextQuestion && <QuestionLoader />}

        {!chatEnded &&
          currentQuestion &&
          !showExperienceRating &&
          !isLoadingNextQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 max-w-xs md:max-w-md shadow-sm">
                <p className="font-medium text-gray-800">
                  {currentQuestion.text}
                </p>
                <div className="flex justify-between mt-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <motion.button
                      key={rating}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRating(rating)}
                      className="text-2xl transition-all"
                    >
                      {rating <= 3 ? (
                        <span className="text-amber-400">😞</span>
                      ) : (
                        <span className="text-emerald-400">😊</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        {!chatEnded && showExperienceRating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 max-w-xs md:max-w-md shadow-sm">
              <p className="text-gray-800">
                How would you rate your overall experience?
              </p>
              <div className="flex justify-between mt-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <motion.button
                    key={`exp-${rating}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExperienceRating(rating)}
                    className="text-2xl transition-all"
                  >
                    {rating <= 3 ? (
                      <span className="text-amber-400">😞</span>
                    ) : (
                      <span className="text-emerald-400">😊</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!chatEnded && showFeedbackInput && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <div className="bg-indigo-500 text-white rounded-2xl rounded-tr-none p-4 max-w-xs md:max-w-md shadow-sm">
              <p className="mb-3">Please provide additional feedback:</p>
              <div className="flex">
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="flex-1 border-0 rounded-l-lg px-3 py-2 text-white placeholder-gray-200 bg-indigo-400 focus:ring-2 focus:ring-indigo-300"
                  placeholder="Your feedback..."
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleFeedbackSubmit()
                  }
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFeedbackSubmit}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors"
                >
                  <FaPaperPlane />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

      {!chatEnded && showIssueReport && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex justify-end"
  >
    <div className="bg-rose-500 text-white rounded-2xl rounded-tr-none p-4 max-w-xs md:max-w-md shadow-sm">
      <p className="mb-3">Describe the issue:</p>
      <div className="flex">
        <input
          type="text"
          value={issueMessage}
          onChange={(e) => setIssueMessage(e.target.value)}
          className="flex-1 border-0 rounded-l-lg px-3 py-2 text-white placeholder-gray-200 bg-rose-400 focus:ring-2 focus:ring-rose-300"
          placeholder="What's the issue?"
          onKeyPress={(e) => e.key === "Enter" && handleIssueReport()}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleIssueReport}
          className="bg-rose-600 text-white px-4 py-2 rounded-r-lg hover:bg-rose-700 transition-colors"
        >
          <FaPaperPlane />
        </motion.button>
      </div>
    </div>
  </motion.div>
)}

        {chatEnded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startNewSession}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-5 py-3 rounded-xl hover:shadow-md transition-all"
            >
              <FaRedo /> Start New Session
            </motion.button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!chatEnded &&
        currentQuestion &&
        !showExperienceRating &&
        !isLoadingNextQuestion && (
          <div className="p-3 bg-white border-t border-gray-100 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowIssueReport(true)}
              className="flex items-center text-rose-500 hover:text-rose-600 text-sm font-medium"
            >
              <FaExclamationCircle className="mr-2" /> Report Issue
            </motion.button>
          </div>
        )}
    </div>
  );
};

export default ChatInterface;
