/* ==========================================================================
   ULINK FRONTEND REAL-TIME WEBSOCKET CLIENT
   ========================================================================== */

const ULinkWS = (() => {
  let socket = null;
  let listeners = {};
  let reconnectTimer = null;
  let isConnecting = false;

  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (isConnecting) return;
    isConnecting = true;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('ULink WebSocket connected');
      isConnecting = false;
      if (reconnectTimer) {
        clearInterval(reconnectTimer);
        reconnectTimer = null;
      }
      trigger('open');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type) {
          trigger(data.type, data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onclose = (event) => {
      console.warn('ULink WebSocket disconnected, code:', event.code);
      isConnecting = false;
      trigger('close');
      
      // Auto-reconnect if not explicitly closed by logout
      if (event.code !== 4001 && !reconnectTimer) {
        reconnectTimer = setInterval(() => {
          console.log('Attempting WebSocket reconnect...');
          connect();
        }, 5000);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err);
      isConnecting = false;
    };
  }

  function disconnect() {
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      socket.close(4001, 'User logged out');
      socket = null;
    }
  }

  // Event dispatching system
  function on(event, callback) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);
  }

  function off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  }

  function clearAllListeners() {
    listeners = {};
  }

  function trigger(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in WebSocket listener for [${event}]:`, e);
        }
      });
    }
  }

  // Senders
  function sendJson(payload) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket not connected. Payload buffered/discarded:', payload);
    }
  }

  return {
    connect,
    disconnect,
    on,
    off,
    clearAllListeners,
    
    sendMessage(threadId, content, messageType = 'text', mediaUrl = null) {
      sendJson({
        type: 'message',
        threadId: parseInt(threadId),
        messageType,
        content,
        mediaUrl
      });
    },

    sendTyping(threadId, isTyping) {
      sendJson({
        type: 'typing',
        threadId: parseInt(threadId),
        isTyping: !!isTyping
      });
    },

    sendReaction(messageId, reaction) {
      sendJson({
        type: 'reaction',
        messageId: parseInt(messageId),
        reaction: reaction || null
      });
    }
  };
})();
