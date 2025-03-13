import express from 'express';
import http from 'http';
import WebSocket from 'ws';

class MockHomeAssistantServer {
  private app = express();
  private server: http.Server | null = null;
  private wsServer: WebSocket.Server | null = null;
  private port = 8123;
  private validToken = 'mock_token';
  private entities = new Map<string, any>();
  private automations = new Map<string, any>();
  
  constructor() {
    this.setupEntities();
    this.setupAutomations();
    this.setupRoutes();
  }
  
  private setupEntities() {
    // Add some default entities
    this.entities.set('light.living_room', {
      entity_id: 'light.living_room',
      state: 'off',
      attributes: {
        friendly_name: 'Living Room Light',
        supported_features: 0
      }
    });
    
    this.entities.set('switch.kitchen', {
      entity_id: 'switch.kitchen',
      state: 'on',
      attributes: {
        friendly_name: 'Kitchen Switch',
        supported_features: 0
      }
    });
    
    this.entities.set('binary_sensor.motion', {
      entity_id: 'binary_sensor.motion',
      state: 'off',
      attributes: {
        friendly_name: 'Motion Sensor',
        device_class: 'motion'
      }
    });
    
    this.entities.set('sun.sun', {
      entity_id: 'sun.sun',
      state: 'above_horizon',
      attributes: {
        friendly_name: 'Sun',
        next_dawn: '2023-03-12T05:30:00+00:00',
        next_dusk: '2023-03-12T18:30:00+00:00',
        next_midnight: '2023-03-12T00:00:00+00:00',
        next_noon: '2023-03-12T12:00:00+00:00',
        next_rising: '2023-03-12T06:00:00+00:00',
        next_setting: '2023-03-12T18:00:00+00:00',
      }
    });
  }
  
  private setupAutomations() {
    // Add some default automations
    this.automations.set('automation.night_light', {
      id: 'automation.night_light',
      alias: 'Night Light',
      description: 'Turn on lights at sunset',
      trigger: [
        {
          platform: 'sun',
          event: 'sunset',
          offset: '+00:30:00'
        }
      ],
      condition: [],
      action: [
        {
          service: 'light.turn_on',
          target: {
            entity_id: 'light.living_room'
          }
        }
      ],
      mode: 'single'
    });
  }
  
  private setupRoutes() {
    // Add authentication middleware
    this.app.use((req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token !== this.validToken && req.path !== '/api/supervisor/ping') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      next();
    });
    
    // API endpoint for checking Home Assistant version
    this.app.get('/api', (req, res) => {
      res.json({
        message: 'API running.',
        version: '2023.3.0'
      });
    });
    
    // API endpoint for entity states
    this.app.get('/api/states', (req, res) => {
      res.json(Array.from(this.entities.values()));
    });
    
    // API endpoint for specific entity state
    this.app.get('/api/states/:entity_id', (req, res) => {
      const entity = this.entities.get(req.params.entity_id);
      if (!entity) {
        return res.status(404).json({ message: 'Entity not found' });
      }
      res.json(entity);
    });
    
    // API endpoint for calling services
    this.app.post('/api/services/:domain/:service', (req, res) => {
      const { domain, service } = req.params;
      const data = req.body;
      
      // Handle entity state changes based on service calls
      if (domain === 'light' && (service === 'turn_on' || service === 'turn_off')) {
        const entityIds = Array.isArray(data.entity_id) ? data.entity_id : [data.entity_id];
        
        entityIds.forEach(entityId => {
          const entity = this.entities.get(entityId);
          if (entity) {
            entity.state = service === 'turn_on' ? 'on' : 'off';
            if (service === 'turn_on' && data.brightness) {
              entity.attributes.brightness = data.brightness;
            }
            this.entities.set(entityId, entity);
          }
        });
      }
      
      res.json({ success: true });
    });
    
    // API endpoint for health check
    this.app.get('/api/supervisor/ping', (req, res) => {
      res.json({ result: 'ok' });
    });
  }
  
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Mock Home Assistant server running at http://localhost:${this.port}`);
        this.setupWebSocket();
        resolve();
      });
    });
  }
  
  private setupWebSocket() {
    this.wsServer = new WebSocket.Server({ server: this.server });
    
    this.wsServer.on('connection', (ws) => {
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle auth message
          if (data.type === 'auth') {
            if (data.access_token === this.validToken) {
              ws.send(JSON.stringify({ type: 'auth_ok', ha_version: '2023.3.0' }));
            } else {
              ws.send(JSON.stringify({ type: 'auth_invalid', message: 'Invalid token' }));
            }
          }
          
          // Handle ping message
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
          
          // Handle get_states message
          if (data.type === 'get_states') {
            ws.send(JSON.stringify({
              id: data.id,
              type: 'result',
              success: true,
              result: Array.from(this.entities.values())
            }));
          }
          
          // Handle config/automation/list message
          if (data.type === 'config/automation/list') {
            ws.send(JSON.stringify({
              id: data.id,
              type: 'result',
              success: true,
              result: Array.from(this.automations.values())
            }));
          }
          
          // Handle config/automation/config message
          if (data.type === 'config/automation/config') {
            const { automation_id, config } = data;
            
            if (automation_id) {
              // Update existing automation
              this.automations.set(automation_id, {
                id: automation_id,
                ...config
              });
            } else if (config) {
              // Create new automation
              const newId = `automation.${config.alias.toLowerCase().replace(/\s+/g, '_')}`;
              this.automations.set(newId, {
                id: newId,
                ...config
              });
            }
            
            ws.send(JSON.stringify({
              id: data.id,
              type: 'result',
              success: true
            }));
          }
          
          // Handle config/automation/delete message
          if (data.type === 'config/automation/delete') {
            const { automation_id } = data;
            
            if (automation_id && this.automations.has(automation_id)) {
              this.automations.delete(automation_id);
            }
            
            ws.send(JSON.stringify({
              id: data.id,
              type: 'result',
              success: true
            }));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          
          // Send error response
          if (data?.id) {
            ws.send(JSON.stringify({
              id: data.id,
              type: 'result',
              success: false,
              error: { message: error.message }
            }));
          }
        }
      });
    });
  }
  
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wsServer) {
        this.wsServer.close();
      }
      
      if (this.server) {
        this.server.close(() => {
          console.log('Mock Home Assistant server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export const mockHomeAssistantServer = new MockHomeAssistantServer();

// If this file is executed directly, start the server
if (require.main === module) {
  mockHomeAssistantServer.start().catch(console.error);
}