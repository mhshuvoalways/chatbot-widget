import React from 'react';
import { Bot, User } from 'lucide-react';
import OptionButtons from './OptionButtons';
import LeadForm from './LeadForm';

const Message = ({ message, config, onOptionSelect }) => {
  const { type, content, timestamp, options = [], leadForm } = message;
  const isUser = type === 'user';
  
  const timeString = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Parse markdown-like content for bot messages
  const parseContent = (text) => {
    if (isUser) return text;
    
    // Simple markdown parsing
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="w-full">
      {/* Message */}
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isUser ? 'bg-gray-100' : ''
            }`}
            style={!isUser ? { backgroundColor: config.primaryColor } : {}}
          >
            {isUser ? (
              <User className="w-4 h-4 text-gray-600" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>

          {/* Message Container */}
          <div className={`flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
            {/* Bubble */}
            <div 
              className={`py-3 px-4 rounded-2xl text-sm leading-relaxed max-w-full break-words ${
                isUser 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-blue-50 text-gray-800'
              }`}
            >
              <div 
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: parseContent(content) }}
              />
            </div>
            
            {/* Timestamp */}
            {timeString && (
              <div className="text-[10px] text-gray-500 px-1">
                {timeString}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Form */}
      {leadForm && leadForm.form_fields && leadForm.form_fields.length > 0 && (
        <div className="flex justify-start ml-10 mb-3">
          <LeadForm leadForm={leadForm} config={config} />
        </div>
      )}

      {/* Options */}
      {options.length > 0 && (
        <div className="flex justify-start ml-10 mb-3">
          <OptionButtons options={options} onOptionSelect={onOptionSelect} config={config} />
        </div>
      )}
    </div>
  );
};

export default Message;