import { Send } from "lucide-react";
import { useState } from "react";

const MessageInput = ({ config, isLoading, onSendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 border-t border-gray-200 flex gap-2 flex-shrink-0"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={config.placeholder}
        disabled={isLoading}
        className="flex-1 py-2 px-3 border border-gray-300 rounded-lg outline-none text-sm disabled:opacity-50 focus:border-blue-500"
      />
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="border-none py-2.5 px-3 rounded-lg cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
        style={{ backgroundColor: config.primaryColor }}
      >
        <Send className="w-5 h-5 text-white" />
      </button>
    </form>
  );
};

export default MessageInput;
