import React from 'react';
import Message from './Message';
import LoadingIndicator from './LoadingIndicator';

const MessageList = ({ messages, config, isLoading, onOptionSelect }) => {
  return (
    <>
      {messages.map((message, index) => (
        <Message
          key={message.id || index}
          message={message}
          config={config}
          onOptionSelect={onOptionSelect}
        />
      ))}
      {isLoading && <LoadingIndicator config={config} />}
    </>
  );
};

export default MessageList;