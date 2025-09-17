import ChatbotWidget from './components/ChatbotWidget';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          React Chatbot Widget Demo
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Welcome to the Demo Page
          </h2>
          <p className="text-gray-600 mb-4">
            This is a demo page showcasing the React chatbot widget. The chatbot widget 
            is now converted from vanilla JavaScript to React with Tailwind CSS while 
            maintaining all original functionality.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <p className="text-blue-800">
              <strong>Features preserved:</strong>
            </p>
            <ul className="list-disc list-inside text-blue-700 mt-2">
              <li>Welcome screen with customizable branding</li>
              <li>AI-powered chat responses</li>
              <li>Option buttons for guided conversations</li>
              <li>Lead form integration</li>
              <li>Local storage for message persistence</li>
              <li>Loading indicators and animations</li>
              <li>Responsive design</li>
              <li>Watermark for non-Pro users</li>
            </ul>
          </div>
          <p className="text-gray-600">
            Click the chat button in the bottom-right corner to start interacting 
            with the chatbot widget!
          </p>
        </div>
      </div>
      
      <ChatbotWidget />
    </div>
  );
};

export default App;
