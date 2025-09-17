import { Bot } from "lucide-react";

const LoadingIndicator = ({ config }) => {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: config.primaryColor }}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="py-3 px-4 rounded-2xl bg-blue-50 text-gray-800">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.16s" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.32s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
