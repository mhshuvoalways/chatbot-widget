import { useEffect, useState } from "react";

const DEFAULT_CONFIG = {
  primaryColor: "#3b82f6",
  welcomeMessage: "Hey! How can I help you today? 👋",
  placeholder: "Chat with an AI agent...",
  title: "Chat with us",
  logoUrl: "",
  supabaseUrl: "https://rwxwoirsbpctwitawfsj.supabase.co",
  supabaseKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eHdvaXJzYnBjdHdpdGF3ZnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3OTIxNTEsImV4cCI6MjA2NDM2ODE1MX0.jpCLXhW7oLUH7_YYWzmpI3wEmAYgD1CG4Tp4cr1EMG0",
  userId: window.chatbotUserId || "89bae0f4-3516-4b49-9316-0e3f59d2698c",
};

export const useChatbot = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [userPlan, setUserPlan] = useState(null);
  const [balance, setBalance] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [leadForms, setLeadForms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 11)}`;

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    await Promise.all([
      loadConfiguration(),
      fetchUserPlan(),
      loadConversations(),
      loadLeadForms(),
    ]);
  };

  const loadConfiguration = async () => {
    if (!config.userId) return;

    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/chatbot_config?select=*&user_id=eq.${config.userId}`,
        {
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        }
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const dbConfig = data[0];
        setConfig((prev) => ({
          ...prev,
          primaryColor: dbConfig.primary_color || prev.primaryColor,
          welcomeMessage: dbConfig.welcome_message || prev.welcomeMessage,
          logoUrl: dbConfig.logo_url || prev.logoUrl,
          placeholder: dbConfig.placeholder || prev.placeholder,
          title: dbConfig.title || prev.title,
          loginRequired: dbConfig.login_required || false,
        }));
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
    }
  };

  const fetchUserPlan = async () => {
    if (!config.userId) return;

    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/profiles?select=last_plan,balance&id=eq.${config.userId}`,
        {
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        }
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setUserPlan(data[0].last_plan);
        setBalance(data[0].balance || 0);
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  };

  const loadConversations = async () => {
    if (!config.userId) return;

    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/conversations?select=conversation_id,message,options&user_id=eq.${config.userId}`,
        {
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        }
      );
      const data = await response.json();

      setConversations(
        (data || []).map((conv) => ({
          conversation_id: conv.conversation_id,
          message: conv.message,
          options: Array.isArray(conv.options)
            ? conv.options.filter(
                (opt) => typeof opt === "object" && opt.label && opt.nextId
              )
            : [],
        }))
      );
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadLeadForms = async () => {
    if (!config.userId) return;

    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/lead_forms?select=*&user_id=eq.${config.userId}`,
        {
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        }
      );
      const data = await response.json();

      setLeadForms(
        (data || []).map((form) => ({
          ...form,
          form_fields: Array.isArray(form.form_fields) ? form.form_fields : [],
        }))
      );
    } catch (error) {
      console.error("Error loading lead forms:", error);
    }
  };

  const getOnlyAIChatMessages = (allMessages) => {
    let aiChatHistory = [];
    let lastBotOptions = null;

    for (let i = 0; i < allMessages.length; i++) {
      const msg = allMessages[i];
      if (msg.type === "bot") {
        lastBotOptions =
          Array.isArray(msg.options) && msg.options.length > 0
            ? msg.options.map((opt) => opt.label)
            : null;
        if (
          aiChatHistory.length > 0 &&
          aiChatHistory[aiChatHistory.length - 1].type === "user" &&
          !aiChatHistory[aiChatHistory.length - 1].__skip
        ) {
          aiChatHistory.push(msg);
        }
      } else if (msg.type === "user") {
        if (lastBotOptions && lastBotOptions.includes(msg.content.trim())) {
          aiChatHistory.push({ ...msg, __skip: true });
        } else {
          aiChatHistory.push(msg);
        }
      }
    }

    return aiChatHistory.filter((msg) => !msg.__skip);
  };

  const buildConversationHistory = (messages) => {
    const aiChat = getOnlyAIChatMessages(messages);
    return aiChat.slice(-10).map((message) => {
      if (message.type === "user") {
        return {
          role: "user",
          content: message.content,
        };
      } else {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = message.content;
        return {
          role: "assistant",
          content: tempDiv.textContent || tempDiv.innerText || "",
        };
      }
    });
  };

  const sendMessage = async (message, messages, addMessage) => {
    setIsLoading(true);

    try {
      const conversationHistory = buildConversationHistory(messages);

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/chat-ai-response`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.supabaseKey}`,
          },
          body: JSON.stringify({
            message,
            userId: config.userId,
            conversationHistory,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to get AI response");

      const data = await response.json();

      setTimeout(() => {
        addMessage("bot", data.response, [
          { label: "Show main menu", nextId: "welcome" },
        ]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setTimeout(() => {
        addMessage(
          "bot",
          "I'm sorry, I'm having trouble responding right now. Please try again later.",
          [{ label: "Go back to main menu", nextId: "welcome" }]
        );
        setIsLoading(false);
      }, 500);
    }
  };

  const handleOptionClick = async (
    option,
    conversations,
    leadForms,
    addMessage,
    trackAnalytics
  ) => {
    setIsLoading(true);

    const nextConv = conversations.find(
      (conv) => conv.conversation_id === option.nextId
    );

    setTimeout(() => {
      setIsLoading(false);
      if (nextConv) {
        const leadForm = leadForms.find(
          (form) => form.conversation_id === option.nextId
        );
        addMessage(
          "bot",
          nextConv.message,
          nextConv.options,
          false,
          null,
          leadForm
        );
        trackAnalytics(option.nextId);
      } else {
        addMessage(
          "bot",
          "I'm sorry, I don't have more information about that topic yet. Is there anything else I can help you with?",
          [{ label: "Go back to main menu", nextId: "welcome" }]
        );
      }
    }, 500);
  };

  const trackAnalytics = async (conversationStep) => {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/chat_analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          conversation_step: conversationStep,
          user_id: config.userId,
        }),
      });
    } catch (error) {
      console.error("Error tracking analytics:", error);
    }
  };

  const resetChat = () => {
    // Reset any chat-specific state if needed
  };

  return {
    config,
    userPlan,
    balance,
    conversations,
    leadForms,
    isLoading,
    sendMessage,
    handleOptionClick,
    trackAnalytics,
    resetChat,
  };
};
