import { useEffect, useState } from "react";

export const useLocalStorage = (userId) => {
  const [messages, setMessages] = useState([]);

  const getLocalStorageKey = () => {
    return `chatbot_ai_messages_${userId || "guest"}`;
  };

  const saveMessages = (messagesToSave) => {
    try {
      localStorage.setItem(
        getLocalStorageKey(),
        JSON.stringify(messagesToSave)
      );
    } catch (e) {
      console.error("Error saving messages to localStorage:", e);
    }
  };

  const loadMessages = () => {
    try {
      const raw = localStorage.getItem(getLocalStorageKey());
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          setMessages(items);
        }
      }
    } catch (e) {
      console.error("Error loading messages from localStorage:", e);
    }
  };

  const addMessage = (
    type,
    content,
    options = [],
    suppressSave = false,
    timestampOverride = null,
    leadForm = null
  ) => {
    const now = timestampOverride ? new Date(timestampOverride) : new Date();

    const newMessage = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      type,
      content,
      timestamp: now.toISOString(),
      options,
      leadForm,
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage];
      if (!suppressSave) {
        saveMessages(updated);
      }
      return updated;
    });
  };

  const clearMessages = () => {
    setMessages([]);
    try {
      localStorage.removeItem(getLocalStorageKey());
    } catch (e) {
      console.error("Error clearing messages from localStorage:", e);
    }
  };

  useEffect(() => {
    loadMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    messages,
    addMessage,
    clearMessages,
    saveMessages: () => saveMessages(messages),
  };
};
