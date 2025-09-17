import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatInterface = ({ 
  messages, 
  config, 
  isLoading, 
  onSendMessage, 
  onOptionSelect 
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
        <MessageList 
          messages={messages}
          config={config}
          isLoading={isLoading}
          onOptionSelect={onOptionSelect}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <MessageInput
        config={config}
        isLoading={isLoading}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};

export default ChatInterface;