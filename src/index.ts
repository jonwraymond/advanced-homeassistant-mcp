import express from 'express';
import dotenv from 'dotenv';
import { HomeAssistantConnection } from './core/homeAssistantConnection';
import { AutomationService } from './services/automationService';
import { AutomationTool } from './tools/automationTool';

// Load environment variables
dotenv.config();

// Create express app
const app = express();
app.use(express.json());

// Create Home Assistant connection
const connection = new HomeAssistantConnection({
  host: process.env.HASS_HOST || 'http://localhost:8123',
  token: process.env.HASS_TOKEN || '',
  socketUrl: process.env.HASS_SOCKET_URL || 'ws://localhost:8123/api/websocket'
});

// Create services
const automationService = new AutomationService(connection);

// Create tools
const automationTool = new AutomationTool(automationService);

// MCP endpoint
app.post('/mcp', async (req, res) => {
  const { tool, ...args } = req.body;
  
  try {
    let result;
    
    // Route to the appropriate tool
    switch (tool) {
      case 'automation':
        result = await automationTool.handler(args);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown tool: ${tool}`
        });
    }
    
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// MCP tool manifest endpoint
app.get('/mcp/tools', (req, res) => {
  return res.json({
    tools: [
      automationTool.getManifest()
    ]
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Try to connect if not already connected
    if (!connection.isConnected()) {
      await connection.connect();
    }
    
    // Get Home Assistant version
    const version = await connection.getVersion();
    
    return res.json({
      status: 'ok',
      homeAssistant: {
        connected: connection.isConnected(),
        version
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Home Assistant MCP server running on port ${PORT}`);
  
  // Connect to Home Assistant
  connection.connect()
    .then(result => {
      if (result.success) {
        console.log('Connected to Home Assistant');
      } else {
        console.error('Failed to connect to Home Assistant:', result.error);
      }
    })
    .catch(error => {
      console.error('Error connecting to Home Assistant:', error);
    });
});