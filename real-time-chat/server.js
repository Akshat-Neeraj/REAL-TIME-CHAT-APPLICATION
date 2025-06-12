const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });
const messageHistory = [];

// Helper function to generate consistent colors for users
const getUserColor = (userId) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F06292', '#7986CB', '#9575CD',
    '#64B5F6', '#4DB6AC', '#81C784', '#FFD54F'
  ];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send message history to new client
  if (messageHistory.length > 0) {
    ws.send(JSON.stringify({
      type: 'history',
      messages: messageHistory
    }));
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      message.timestamp = new Date().toISOString();
      
      // Add color if not already set
      if (!message.color) {
        message.color = getUserColor(message.sender);
      }

      // Store in history (limit to 100 messages)
      messageHistory.push(message);
      if (messageHistory.length > 100) {
        messageHistory.shift();
      }

      // Broadcast to all other clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          const messageToSend = {
            ...message,
            direction: 'received'
          };
          client.send(JSON.stringify(messageToSend));
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket server running on ws://localhost:3000');