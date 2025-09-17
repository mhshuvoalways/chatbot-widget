(() => {
  "use strict";

  // --------- Marked Initialization ---------
  if (!window.marked) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    script.onload = function () {};
    document.head.appendChild(script);
  }

  // --------- Constants & Defaults ---------
  const BOT_LOGO = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
  `;
  const MESSAGE_SQUARE = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  `;
  const DEFAULT_CONFIG = {
    primaryColor: "#3b82f6",
    welcomeMessage: "Hey! How can I help you today? 👋",
    placeholder: "Chat with an AI agent...",
    title: "Chat with us",
    logoUrl: "",
    supabaseUrl: "https://rwxwoirsbpctwitawfsj.supabase.co",
    supabaseKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eHdvaXJzYnBjdHdpdGF3ZnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3OTIxNTEsImV4cCI6MjA2NDM2ODE1MX0.jpCLXhW7oLUH7_YYWzmpI3wEmAYgD1CG4Tp4cr1EMG0",
  };
  const WATERMARK_ID =
    "chatbot-watermark-" + Math.random().toString(36).slice(2, 10);

  // --------- State ---------
  const userId = window.chatbotUserId || null;
  let userPlan = null;
  let balance = 0;
  let config = { ...DEFAULT_CONFIG };
  let isOpen = false;
  let showWelcome = true;
  let container,
    widget,
    welcomeScreen,
    messages,
    input,
    sendButton,
    toggleButton;
  let conversations = [];
  let currentMessages = [];
  let leadForms = [];
  const sessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 11)}`;
  let isLoading = false;

  // --------- Local Storage Key ---------
  function getLocalStorageKey() {
    return `chatbot_ai_messages_${userId || "guest"}`;
  }

  // --------- Filter AI Chat Only ---------
  function getOnlyAIChatMessages(allMessages) {
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
  }

  // --------- Initialization ---------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWidget);
  } else {
    initializeWidget();
  }

  // --------- Initialization Function ---------
  async function initializeWidget() {
    await loadConfiguration();
    await fetchUserPlan();
    await loadConversations();
    await loadLeadForms();
    loadLocalMessages();

    showWelcome = currentMessages.length === 0;

    createWidget();
    injectStyle();
    maybeAddWatermark();
  }

  // --------- Data Loading ---------
  async function loadConfiguration() {
    if (!userId) return;
    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/chatbot_config?select=*&user_id=eq.${userId}`,
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
        config = {
          ...config,
          primaryColor: dbConfig.primary_color || config.primaryColor,
          welcomeMessage: dbConfig.welcome_message || config.welcomeMessage,
          logoUrl: dbConfig.logo_url || config.logoUrl,
          placeholder: dbConfig.placeholder || config.placeholder,
          title: dbConfig.title || config.title,
          loginRequired: dbConfig.login_required || false,
        };
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
    }
  }

  async function fetchUserPlan() {
    if (!userId) return;
    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/profiles?select=last_plan,balance&id=eq.${userId}`,
        {
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        }
      );
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        userPlan = data[0].last_plan;
        balance = data[0].balance || 0;
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  }

  async function loadConversations() {
    if (!userId) return;
    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/conversations?select=conversation_id,message,options&user_id=eq.${userId}`,
        {
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        }
      );
      const data = await response.json();
      conversations = (data || []).map((conv) => ({
        conversation_id: conv.conversation_id,
        message: conv.message,
        options: Array.isArray(conv.options)
          ? conv.options.filter(
              (opt) => typeof opt === "object" && opt.label && opt.nextId
            )
          : [],
      }));
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }

  async function loadLeadForms() {
    if (!userId) return;
    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/lead_forms?select=*&user_id=eq.${userId}`,
        {
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${config.supabaseKey}`,
          },
        }
      );
      const data = await response.json();
      leadForms = (data || []).map((form) => ({
        ...form,
        form_fields: Array.isArray(form.form_fields) ? form.form_fields : [],
      }));
    } catch (error) {
      console.error("Error loading lead forms:", error);
    }
  }

  // --------- Local Storage Handling ---------
  function saveMessagesToLocal() {
    const messagesToSave = currentMessages;
    try {
      localStorage.setItem(
        getLocalStorageKey(),
        JSON.stringify(messagesToSave)
      );
    } catch (e) {
      // ignore
    }
  }

  function loadLocalMessages() {
    try {
      const raw = localStorage.getItem(getLocalStorageKey());
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          currentMessages = items;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // --------- Widget Creation ---------
  function createWidget() {
    container = document.createElement("div");
    container.id = "chatbot-widget-container";
    container.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 9999;
    `;

    // Toggle Button
    toggleButton = document.createElement("button");
    toggleButton.innerHTML = MESSAGE_SQUARE;
    toggleButton.id = "chatbot-toggle-btn";
    toggleButton.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      margin: 0 0 0 auto;
      background-color: ${config.primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s cubic-bezier(.4,0,.2,1), bottom 0.3s cubic-bezier(.4,0,.2,1);
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      right: 0;
      bottom: 0;
      will-change: transform, opacity;
    `;
    toggleButton.onmouseover = () =>
      (toggleButton.style.transform = "scale(1.1)");
    toggleButton.onmouseout = () => (toggleButton.style.transform = "scale(1)");
    toggleButton.onclick = toggleWidget;

    // Widget Window
    widget = document.createElement("div");
    widget.style.cssText = `
      width: 360px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      display: none;
      flex-direction: column;
      margin-bottom: 10px;
      position: absolute;
      right: 0;
      bottom: 0;
      z-index: 999;
      opacity: 0;
      transform: translateY(40px) scale(0.98);
      transition: opacity 0.3s cubic-bezier(.4,0,.2,1), transform 0.3s cubic-bezier(.4,0,.2,1);
      will-change: opacity, transform;
    `;

    createWidgetContent();

    container.appendChild(widget);
    container.appendChild(toggleButton);
    document.body.appendChild(container);
  }

  function createWidgetContent() {
    widget.innerHTML = ""; // Clear widget content

    // Header
    const header = document.createElement("div");
    header.setAttribute("data-header", "true");
    header.style.cssText = `
      background-color: ${config.primaryColor};
      color: white;
      padding: 16px;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 8px;"></div>
        <span data-title="true" style="font-weight: 600;">${config.title}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <button title="Reset" data-reset="true" style="cursor: pointer; background:none; border: none; padding: 4px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        </button>
        <button title="Close" id="close-chat" style="cursor: pointer; background:none; border: none; padding: 4px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    `;
    header.querySelector("#close-chat").onclick = toggleWidget;
    header.querySelector("[data-reset]").onclick = resetChat;

    // Welcome Screen
    function hexToRGBA(hex, alpha = 1) {
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
    }

    welcomeScreen = document.createElement("div");
    welcomeScreen.id = "welcome-screen";
    welcomeScreen.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 0 16px;
      gap: 16px;
      border-radius: 0 0 12px 12px;
      background: linear-gradient(135deg, ${hexToRGBA(
        config.primaryColor,
        0.2
      )} 0%, #ffffff 100%)
    `;
    welcomeScreen.innerHTML = `
      <div style="margin-right: auto">
      ${
        config.logoUrl
          ? `<img src=${config.logoUrl} style="width: 70px; height: 70px" />`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke=${config.primaryColor} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`
      }
      </div>
      <h1 style="margin: 0 0 8px 0; color: #1f2937; font-size: 28px; font-weight: bold; width: 80%; margin-right: auto">${
        config.welcomeMessage
      }</h1>
      <div style="background: #ffffff; border-radius: 8px; padding: 16px;">
      <div style="display: flex; gap: 8px; align-items: center">
        <div>
        <div data-chat-icon="true" style="width: 30px; height: 30px; background: ${
          config.primaryColor
        }; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          ${BOT_LOGO}
        </div>
        </div>
        <div>
          <small style="margin: 0; color: rgb(110, 110, 110)">ChatBot</small>
          <p style="margin: 4px 0">Let me know if you have any questions!</p>
        </div>
      </div>
      <button data-start-button="true" id="start-chat" style="
        background: ${config.primaryColor};
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        margin-top: 16px;
        width: 100%
      ">Start Conversation</button>
      </div>
    `;
    welcomeScreen.querySelector("#start-chat").onclick = startChat;

    // Chat Interface
    const chatInterface = document.createElement("div");
    chatInterface.id = "chat-interface";
    chatInterface.style.cssText = `
      flex: 1;
      display: none;
      flex-direction: column;
      min-height: 0;
    `;

    // Messages Area
    messages = document.createElement("div");
    messages.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
    `;

    renderLocalMessages();

    // Input Area and sendButton
    const inputContainer = document.createElement("div");
    inputContainer.style.cssText = `
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    `;

    input = document.createElement("input");
    input.type = "text";
    input.placeholder = config.placeholder;
    input.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      outline: none;
      font-size: 14px;
    `;
    input.onkeydown = (e) => {
      if (e.key === "Enter" && !isLoading && input.value.trim()) sendMessage();
    };

    sendButton = document.createElement("button");
    sendButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>
    `;
    sendButton.style.cssText = `
      background: ${config.primaryColor};
      border: none;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      opacity: 0.5;
    `;
    sendButton.disabled = true;
    sendButton.onclick = sendMessage;

    input.addEventListener("input", function () {
      const hasText = this.value.trim().length > 0;
      sendButton.disabled = !hasText;
      sendButton.style.opacity = hasText ? "1" : "0.5";
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);

    chatInterface.appendChild(messages);
    chatInterface.appendChild(inputContainer);

    widget.appendChild(header);
    widget.appendChild(welcomeScreen);
    widget.appendChild(chatInterface);

    updateWidgetAppearance();

    if (showWelcome) {
      welcomeScreen.style.display = "flex";
      chatInterface.style.display = "none";
    } else {
      welcomeScreen.style.display = "none";
      chatInterface.style.display = "flex";
      setTimeout(() => {
        if (messages) messages.scrollTop = messages.scrollHeight;
        if (input) input.focus();
      }, 100);
    }
  }

  // --------- Render Local Messages on Open ---------
  function renderLocalMessages() {
    if (!messages) return;
    messages.innerHTML = "";
    if (Array.isArray(currentMessages) && currentMessages.length > 0) {
      currentMessages.forEach((msg) => {
        addMessage(
          msg.type,
          msg.content,
          msg.options || [],
          true,
          msg.timestamp,
          msg.leadForm
        );
      });
      setTimeout(() => {
        messages.scrollTop = messages.scrollHeight;
      }, 10);
    }
  }

  // --------- Watermark ---------
  function maybeAddWatermark() {
    const old = welcomeScreen.querySelector(`#${WATERMARK_ID}`);
    if (old) old.remove();

    if (userPlan !== "Pro") {
      const watermark = document.createElement("div");
      watermark.id = WATERMARK_ID;
      watermark.style.cssText = `
      width: 100%;
      padding: 8px 0;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      background: transparent;
      position: absolute;
      bottom: 0;
      left: 0;
      border-radius: 0 0 12px 12px;
      z-index: 10;
    `;
      watermark.innerHTML = `Powered by <a href="https://chatbotsense.com" target="_blank" style="color: ${config.primaryColor}; text-decoration: underline; cursor: pointer;">ChatbotSense</a>`;
      welcomeScreen.appendChild(watermark);
    }
  }

  // --------- UI Updates ---------
  function updateWidgetAppearance() {
    if (toggleButton) toggleButton.style.backgroundColor = config.primaryColor;
    const header = widget.querySelector("[data-header]");
    if (header) {
      header.style.backgroundColor = config.primaryColor;
      const titleElement = header.querySelector("[data-title]");
      if (titleElement) titleElement.textContent = config.title;
    }
    if (input) input.placeholder = config.placeholder;
    if (sendButton) sendButton.style.backgroundColor = config.primaryColor;
    const startButton = widget.querySelector("[data-start-button]");
    if (startButton) startButton.style.backgroundColor = config.primaryColor;
    const chatIcon = widget.querySelector("[data-chat-icon]");
    if (chatIcon) chatIcon.style.backgroundColor = config.primaryColor;
  }

  function injectStyle() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      .rich-text-content {
        font-family: inherit;
      }
      .rich-text-content h1, .rich-text-content h2, .rich-text-content h3 {
        font-weight: bold;
        margin: 8px 0 4px 0;
      }
      .rich-text-content h1 { font-size: 1.2em; }
      .rich-text-content h2 { font-size: 1.1em; }
      .rich-text-content h3 { font-size: 1.05em; }
      .rich-text-content strong { font-weight: bold; }
      .rich-text-content em { font-style: italic; }
      .rich-text-content u { text-decoration: underline; }
      .rich-text-content a { color: #3b82f6; text-decoration: underline; }
      .rich-text-content ul, .rich-text-content ol { margin: 4px 0; padding-left: 16px; }
      .rich-text-content li { margin: 2px 0; }
      .rich-text-content p { margin: 4px 0; }
      #chatbot-widget-container {
        transition: bottom 0.3s cubic-bezier(.4,0,.2,1);
      }
      .lead-form {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin: 8px 0;
      }
      .lead-form input, .lead-form textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        margin-bottom: 8px;
        font-size: 14px;
        outline: none;
      }
      .lead-form button {
        background: ${config.primaryColor};
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        width: 100%;
      }
      .lead-form label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        color: #374151;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  // --------- Widget Behavior ---------
  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      toggleButton.style.pointerEvents = "none";
      toggleButton.style.transform = "translateY(80px) scale(0.95)";
      toggleButton.style.opacity = "0";
      setTimeout(() => {
        toggleButton.style.display = "none";
        widget.style.display = "flex";
        setTimeout(() => {
          widget.style.opacity = "1";
          widget.style.transform = "translateY(0) scale(1)";
          if (!showWelcome) {
            setTimeout(() => {
              if (messages) messages.scrollTop = messages.scrollHeight;
              if (input) input.focus();
            }, 100);
          }
        }, 10);
      }, 250);
      if (showWelcome) {
        widget.querySelector("#welcome-screen").style.display = "flex";
        widget.querySelector("#chat-interface").style.display = "none";
      } else {
        widget.querySelector("#welcome-screen").style.display = "none";
        widget.querySelector("#chat-interface").style.display = "flex";
        renderLocalMessages();
        setTimeout(() => {
          if (messages) messages.scrollTop = messages.scrollHeight;
          if (input) input.focus();
        }, 100);
      }
    } else {
      widget.style.opacity = "0";
      widget.style.transform = "translateY(40px) scale(0.98)";
      setTimeout(() => {
        widget.style.display = "none";
        toggleButton.style.display = "flex";
        setTimeout(() => {
          toggleButton.style.transform = "translateY(0) scale(1)";
          toggleButton.style.opacity = "1";
          toggleButton.style.pointerEvents = "auto";
        }, 10);
      }, 250);
    }
  }

  async function startChat() {
    // Check if login is required
    if (config.loginRequired && userId) {
      // Check if user already provided info for this session
      const storedUserInfo = localStorage.getItem(
        `chatbot_user_${userId}_${sessionId}`
      );

      if (!storedUserInfo) {
        showLoginForm();
        return;
      }
    }

    showWelcome = false;
    widget.querySelector("#welcome-screen").style.display = "none";
    widget.querySelector("#chat-interface").style.display = "flex";
    renderLocalMessages();
    setTimeout(() => {
      if (messages) messages.scrollTop = messages.scrollHeight;
      if (input) input.focus();
    }, 100);
    if (!currentMessages.length) {
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
  }

  function resetChat() {
    currentMessages = [];
    saveMessagesToLocal();
    if (messages) messages.innerHTML = "";
    showWelcome = true;
    widget.querySelector("#welcome-screen").style.display = "flex";
    widget.querySelector("#chat-interface").style.display = "none";
    maybeAddWatermark();
  }

  function buildConversationHistory() {
    const aiChat = getOnlyAIChatMessages(currentMessages);
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
  }

  function addMessage(
    sender,
    content,
    options = [],
    suppressSave = false,
    timestampOverride,
    leadForm = null
  ) {
    const now = timestampOverride ? new Date(timestampOverride) : new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Message Row
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
      display: flex;
      ${
        sender === "user"
          ? "justify-content: flex-end;"
          : "justify-content: flex-start;"
      }
    `;
    // Message Content
    const messageContent = document.createElement("div");
    messageContent.style.cssText = `
      display: flex;
      gap: 8px;
      max-width: 80%;
      ${sender === "user" ? "flex-direction: row-reverse;" : ""}
    `;
    // Avatar
    const avatar = document.createElement("div");
    avatar.style.cssText = `
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      ${
        sender === "user"
          ? "background: #f3f4f6;"
          : `background: ${config.primaryColor};`
      }
    `;
    const avatarIcon = document.createElement("div");
    avatarIcon.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${sender === "user" ? "#6b7280" : "white"};
      font-size: 16px;
    `;
    avatarIcon.innerHTML = sender === "user" ? "👤" : BOT_LOGO;
    avatar.appendChild(avatarIcon);

    // Message Container (bubble + time)
    const messageContainer = document.createElement("div");
    messageContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      ${
        sender === "user"
          ? "align-items: flex-end;"
          : "align-items: flex-start;"
      }
      gap: 2px;
    `;
    // Bubble
    const bubble = document.createElement("div");
    bubble.style.cssText = `
      padding: 12px 16px;
      border-radius: 16px;
      ${
        sender === "user"
          ? "background: #f3f4f6; color: #1f2937;"
          : "background: #dbeafe; color: #1f2937;"
      }
      font-size: 14px;
      line-height: 1.4;
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    `;
    // Rich Text/Markdown support
    const contentDiv = document.createElement("div");
    contentDiv.className = "rich-text-content";
    if (sender === "bot" && window.marked) {
      contentDiv.innerHTML = window.marked.parse(content);
      setTimeout(() => input.focus(), 50);
    } else {
      contentDiv.innerHTML = content;
    }
    bubble.appendChild(contentDiv);
    const timestamp = document.createElement("div");
    timestamp.style.cssText = `
      font-size: 10px;
      color: #6b7280;
      padding: 0 4px;
    `;
    timestamp.textContent = timeString;

    messageContainer.appendChild(bubble);
    messageContainer.appendChild(timestamp);
    messageContent.appendChild(avatar);
    messageContent.appendChild(messageContainer);
    messageDiv.appendChild(messageContent);
    messages.appendChild(messageDiv);

    // Lead Form (if any)
    if (leadForm && leadForm.form_fields && leadForm.form_fields.length > 0) {
      const formContainer = document.createElement("div");
      formContainer.style.cssText = `
        display: flex;
        justify-content: flex-start;
        margin-left: 40px;
        margin-bottom: 12px;
      `;

      const form = document.createElement("div");
      form.className = "lead-form";
      form.style.cssText = `
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        max-width: 80%;
        width: 100%;
      `;

      const formTitle = document.createElement("h4");
      formTitle.textContent = "Please fill out this form:";
      formTitle.style.cssText = `
        margin: 0 0 12px 0;
        font-weight: 600;
        color: #374151;
      `;
      form.appendChild(formTitle);

      const formData = {};

      leadForm.form_fields.forEach((field) => {
        const fieldContainer = document.createElement("div");
        fieldContainer.style.marginBottom = "12px";

        const label = document.createElement("label");
        label.textContent = field.label + (field.required ? " *" : "");
        label.style.cssText = `
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        `;
        fieldContainer.appendChild(label);

        let inputElement;
        if (field.type === "textarea") {
          inputElement = document.createElement("textarea");
          inputElement.rows = 3;
        } else {
          inputElement = document.createElement("input");
          inputElement.type = field.type;
        }

        inputElement.placeholder =
          field.placeholder || `Enter ${field.label.toLowerCase()}`;
        inputElement.required = field.required;
        inputElement.style.cssText = `
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
        `;

        inputElement.addEventListener("input", (e) => {
          formData[field.id] = e.target.value;
        });

        fieldContainer.appendChild(inputElement);
        form.appendChild(fieldContainer);
      });

      const submitButton = document.createElement("button");
      submitButton.textContent = "Submit";
      submitButton.style.cssText = `
        background: ${config.primaryColor};
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        width: 100%;
        margin-top: 8px;
      `;

      submitButton.addEventListener("click", async () => {
        try {
          // Validate required fields
          const isValid = leadForm.form_fields.every((field) => {
            if (field.required && !formData[field.id]) {
              return false;
            }
            return true;
          });

          if (!isValid) {
            alert("Please fill in all required fields.");
            return;
          }

          // Submit the form
          const response = await fetch(
            `${config.supabaseUrl}/functions/v1/submit-lead`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.supabaseKey}`,
              },
              body: JSON.stringify({
                conversationId: leadForm.conversation_id,
                formData: formData,
                websiteUrl: window.location.href,
              }),
            }
          );

          if (response.ok) {
            form.innerHTML = `
              <div style="text-align: center; color: #10b981; font-weight: 600;">
                ✓ Thank you! Your information has been submitted successfully.
              </div>
            `;
            addMessage(
              "bot",
              "Thank you for submitting your information! We'll get back to you soon.",
              []
            );
          } else {
            throw new Error("Failed to submit form");
          }
        } catch (error) {
          console.error("Error submitting form:", error);
          alert("There was an error submitting the form. Please try again.");
        }
      });

      form.appendChild(submitButton);
      formContainer.appendChild(form);
      messages.appendChild(formContainer);
    }

    // Options (if any)
    if (options.length > 0) {
      const optionsContainer = document.createElement("div");
      optionsContainer.style.cssText = `
        display: flex;
        justify-content: flex-start;
        margin-left: 40px;
        margin-bottom: 12px;
      `;
      const optionsDiv = document.createElement("div");
      optionsDiv.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        max-width: 80%;
      `;
      options.forEach((option) => {
        const optionButton = document.createElement("button");
        optionButton.textContent = option.label;
        optionButton.style.cssText = `
          background: white;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          text-align: center;
          transition: all 0.2s;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
        `;
        optionButton.onmouseover = () => {
          optionButton.style.backgroundColor = "#f9fafb";
          optionButton.style.borderColor = config.primaryColor;
        };
        optionButton.onmouseout = () => {
          optionButton.style.backgroundColor = "white";
          optionButton.style.borderColor = "#d1d5db";
        };
        optionButton.onclick = () => handleOptionClick(option);
        optionsDiv.appendChild(optionButton);
      });
      optionsContainer.appendChild(optionsDiv);
      messages.appendChild(optionsContainer);
    }

    messages.scrollTop = messages.scrollHeight;
    if (!suppressSave) {
      currentMessages.push({
        id: `${sender}_${Date.now()}`,
        type: sender,
        content,
        timestamp: now.toISOString(),
        options,
        leadForm,
      });
      saveMessagesToLocal();
    }
  }

  function handleOptionClick(option) {
    addMessage("user", option.label);
    setLoading(true);
    const nextConv = conversations.find(
      (conv) => conv.conversation_id === option.nextId
    );

    if (balance < 1) {
      setTimeout(() => {
        setLoading(false);
        addMessage(
          "bot",
          "It seems that the chatbot has insufficient balance to continue the conversation. Please contact the site administrator.",
          []
        );
        if (input) input.focus();
      }, 500);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      if (nextConv) {
        // Check if there's a lead form for this conversation
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
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message || isLoading) return;
    sendButton.disabled = true;
    sendButton.style.opacity = "0.5";
    input.value = "";
    addMessage("user", message);
    setLoading(true);

    if (balance < 1) {
      setTimeout(() => {
        setLoading(false);
        addMessage(
          "bot",
          "It seems that the chatbot has insufficient balance to continue the conversation. Please contact the site administrator.",
          []
        );
        if (input) input.focus();
      }, 500);
      return;
    }

    try {
      const conversationHistory = buildConversationHistory();

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
            userId: userId,
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
        setLoading(false);
        if (input) input.focus();
      }, 500);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setTimeout(() => {
        addMessage(
          "bot",
          "I'm sorry, I'm having trouble responding right now. Please try again later.",
          [{ label: "Go back to main menu", nextId: "welcome" }]
        );
        setLoading(false);
        if (input) input.focus();
      }, 500);
    }
  }

  function setLoading(loading) {
    isLoading = loading;
    if (input) input.disabled = loading;
    if (sendButton) {
      sendButton.disabled = loading || !input.value.trim();
      sendButton.style.opacity = loading
        ? "0.5"
        : input.value.trim().length > 0
        ? "1"
        : "0.5";
    }
    if (loading) {
      // Add loading indicator
      const loadingDiv = document.createElement("div");
      loadingDiv.id = "loading-indicator";
      loadingDiv.style.cssText = `
        display: flex;
        justify-content: flex-start;
        margin-bottom: 12px;
      `;
      loadingDiv.innerHTML = `
        <div style="display: flex; align-items: start; gap: 8px; max-width: 80%;">
          <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${config.primaryColor};">
            ${BOT_LOGO}
          </div>
          <div style="padding: 12px 16px; border-radius: 16px; background: #dbeafe; color: #1f2937;">
            <div style="display: flex; gap: 4px;">
              <div style="width: 8px; height: 8px; background: #6b7280; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out;"></div>
              <div style="width: 8px; height: 8px; background: #6b7280; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; animation-delay: 0.16s;"></div>
              <div style="width: 8px; height: 8px; background: #6b7280; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; animation-delay: 0.32s;"></div>
            </div>
          </div>
        </div>
      `;
      messages.appendChild(loadingDiv);
      messages.scrollTop = messages.scrollHeight;
    } else {
      const loadingIndicator = document.getElementById("loading-indicator");
      if (loadingIndicator) loadingIndicator.remove();
    }
  }

  // --------- Login Form for Chatbot Users ---------
  function showLoginForm() {
    // Clear previous content and show login form
    welcomeScreen.innerHTML = `
      <div style="width: 100%; padding: 20px;">
        <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: bold; text-align: center;">
          Welcome! Please introduce yourself
        </h2>
        <p style="margin: 0 0 20px 0; color: #6b7280; text-align: center;">
          We'd like to know who we're chatting with
        </p>
        
        <div id="login-form" style="background: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Name *</label>
            <input 
              type="text" 
              id="user-name" 
              placeholder="Enter your name"
              style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box;"
              required
            />
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Email *</label>
            <input 
              type="email" 
              id="user-email" 
              placeholder="Enter your email"
              style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box;"
              required
            />
          </div>
          
          <button 
            id="login-submit" 
            style="background: ${config.primaryColor}; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; width: 100%;"
          >
            Continue to Chat
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const nameInput = welcomeScreen.querySelector("#user-name");
    const emailInput = welcomeScreen.querySelector("#user-email");
    const submitButton = welcomeScreen.querySelector("#login-submit");

    const validateAndSubmit = async () => {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();

      if (!name || !email) {
        alert("Please fill in both name and email fields.");
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }

      try {
        submitButton.textContent = "Submitting...";
        submitButton.disabled = true;

        // Store user info via edge function
        const response = await fetch(
          `${config.supabaseUrl}/functions/v1/store-chatbot-user`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.supabaseKey}`,
            },
            body: JSON.stringify({
              name: name,
              email: email,
              sessionId: sessionId,
              userId: userId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to store user information");
        }

        // Store in localStorage to avoid asking again in this session
        localStorage.setItem(
          `chatbot_user_${userId}_${sessionId}`,
          JSON.stringify({
            name,
            email,
            timestamp: Date.now(),
          })
        );

        // Continue to chat
        createWidgetContent(); // Recreate the welcome screen
        startChat();
      } catch (error) {
        console.error("Error storing user information:", error);
        alert(
          "There was an error submitting your information. Please try again."
        );
        submitButton.textContent = "Continue to Chat";
        submitButton.disabled = false;
      }
    };

    submitButton.onclick = validateAndSubmit;

    // Allow enter key to submit
    nameInput.onkeydown = emailInput.onkeydown = (e) => {
      if (e.key === "Enter") {
        validateAndSubmit();
      }
    };

    // Focus on name input
    setTimeout(() => nameInput.focus(), 100);
  }

  async function trackAnalytics(conversationStep) {
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
          user_id: userId,
        }),
      });
    } catch (error) {
      console.error("Error tracking analytics:", error);
    }
  }
})();
