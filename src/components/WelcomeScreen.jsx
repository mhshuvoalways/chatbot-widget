import { Bot } from "lucide-react";

const WelcomeScreen = ({ config, userPlan, onStartChat }) => {
  const hexToRGBA = (hex, alpha = 1) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = "0x" + hex[1] + hex[1];
      g = "0x" + hex[2] + hex[2];
      b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
      r = "0x" + hex[1] + hex[2];
      g = "0x" + hex[3] + hex[4];
      b = "0x" + hex[5] + hex[6];
    }
    return `rgba(${+r}, ${+g}, ${+b}, ${alpha})`;
  };

  return (
    <div
      className="flex-1 flex flex-col justify-center items-center px-4 gap-4 rounded-b-xl relative"
      style={{
        background: `linear-gradient(135deg, ${hexToRGBA(
          config.primaryColor,
          0.2
        )} 0%, #ffffff 100%)`,
      }}
    >
      <div className="mr-auto">
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="Logo" className="size-[70px]" />
        ) : (
          <Bot
            className="size-[70px]"
            style={{ color: config.primaryColor }}
          />
        )}
      </div>

      <h1 className="m-0 mb-2 text-gray-800 text-[28px] font-bold w-4/5 mr-auto">
        {config.welcomeMessage}
      </h1>

      <div className="bg-white rounded-lg p-4 w-full">
        <div className="flex gap-2 items-center">
          <div>
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: config.primaryColor }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <small className="m-0 text-gray-500">ChatBot</small>
            <p className="my-1 mx-0">Let me know if you have any questions!</p>
          </div>
        </div>

        <button
          onClick={onStartChat}
          className="text-white border-none py-3 px-6 rounded-lg cursor-pointer font-semibold text-sm mt-4 w-full hover:opacity-90 transition-opacity"
          style={{ backgroundColor: config.primaryColor }}
        >
          Start Conversation
        </button>
      </div>

      {/* Watermark */}
      {userPlan !== "Pro" && (
        <div className="w-full py-2 text-center text-xs text-gray-400 bg-transparent absolute bottom-0 left-0 rounded-b-xl z-10">
          Powered by{" "}
          <a
            href="https://chatbotsense.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline cursor-pointer hover:opacity-80"
            style={{ color: config.primaryColor }}
          >
            ChatbotSense
          </a>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
