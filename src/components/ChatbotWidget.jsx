import { MessageSquare, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatbot } from "../hooks/useChatbot";
import { useLocalStorage } from "../hooks/useLocalStorage";
import ChatInterface from "./ChatInterface";
import WelcomeScreen from "./WelcomeScreen";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const toggleButtonRef = useRef(null);
  const widgetRef = useRef(null);

  const {
    config,
    userPlan,
    balance,
    conversations,
    leadForms,
    isLoading,
    sendMessage: sendAIMessage,
    handleOptionClick,
    trackAnalytics,
    resetChat: resetChatData,
  } = useChatbot();

  const { messages, addMessage, clearMessages } = useLocalStorage(
    config.userId
  );

  useEffect(() => {
    setShowWelcome(messages.length === 0);
  }, [messages.length]);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  const resetChat = () => {
    clearMessages();
    resetChatData();
    setShowWelcome(true);
  };

  const startChat = async () => {
    if (config.loginRequired && config.userId) {
      const storedUserInfo = localStorage.getItem(
        `chatbot_user_${config.userId}_${Date.now()}`
      );

      if (!storedUserInfo) {
        // Handle login form - for now, we'll skip this complex flow
        console.log("Login required but not implemented in this conversion");
      }
    }

    setShowWelcome(false);

    if (messages.length === 0) {
      const welcomeConv = conversations.find(
        (conv) => conv.conversation_id === "welcome"
      );

      if (welcomeConv && welcomeConv.options) {
        addMessage("bot", welcomeConv.message, welcomeConv.options);
      } else {
        addMessage("bot", config.welcomeMessage, []);
      }
      trackAnalytics("welcome");
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading) return;

    addMessage("user", message);

    if (balance < 1) {
      setTimeout(() => {
        addMessage(
          "bot",
          "It seems that the chatbot has insufficient balance to continue the conversation. Please contact the site administrator.",
          []
        );
      }, 500);
      return;
    }

    await sendAIMessage(message, messages, addMessage);
  };

  const handleOptionSelect = async (option) => {
    addMessage("user", option.label);

    if (balance < 1) {
      setTimeout(() => {
        addMessage(
          "bot",
          "It seems that the chatbot has insufficient balance to continue the conversation. Please contact the site administrator.",
          []
        );
      }, 500);
      return;
    }

    await handleOptionClick(
      option,
      conversations,
      leadForms,
      addMessage,
      trackAnalytics
    );
  };

  return (
    <div className="fixed right-5 bottom-5 z-[9999]">
      {/* Toggle Button */}
      <button
        ref={toggleButtonRef}
        onClick={toggleWidget}
        className={`w-15 h-15 rounded-full border-none cursor-pointer text-2xl shadow-lg transition-all duration-300 ease-out flex items-center justify-center absolute right-0 bottom-0 hover:scale-110 ${
          isOpen
            ? "translate-y-20 scale-95 opacity-0 pointer-events-none"
            : "translate-y-0 scale-100 opacity-100"
        }`}
        style={{ backgroundColor: config.primaryColor }}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>

      {/* Widget Window */}
      <div
        ref={widgetRef}
        className={`w-90 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col mb-2.5 absolute right-0 bottom-0 z-[999] transition-all duration-300 ease-out ${
          isOpen
            ? "flex opacity-100 translate-y-0 scale-100"
            : "hidden opacity-0 translate-y-10 scale-98"
        }`}
      >
        {/* Header */}
        <div
          className="text-white p-4 rounded-t-xl flex justify-between items-center flex-shrink-0"
          style={{ backgroundColor: config.primaryColor }}
        >
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="font-semibold">{config.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={resetChat}
              className="cursor-pointer bg-transparent border-none p-1 hover:opacity-80"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={toggleWidget}
              className="cursor-pointer bg-transparent border-none p-1 hover:opacity-80"
              title="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        {showWelcome ? (
          <WelcomeScreen
            config={config}
            userPlan={userPlan}
            onStartChat={startChat}
          />
        ) : (
          <ChatInterface
            messages={messages}
            config={config}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onOptionSelect={handleOptionSelect}
          />
        )}
      </div>
    </div>
  );
};

export default ChatbotWidget;
