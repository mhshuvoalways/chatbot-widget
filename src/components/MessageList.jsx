import LoadingIndicator from "./LoadingIndicator";
import Message from "./Message";

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
