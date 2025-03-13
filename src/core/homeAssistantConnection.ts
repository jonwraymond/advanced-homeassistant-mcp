import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';

export interface HomeAssistantConnectionConfig {
  host: string;
  token: string;
  socketUrl: string;
}

export interface ConnectionResult {
  success: boolean;
  error?: Error | string;
}

export class HomeAssistantConnection {
  private config: HomeAssistantConnectionConfig;
  private httpClient: AxiosInstance;
  private wsClient: WebSocket | null = null;
  private connected = false;
  private messageQueue: Map<number, { resolve: Function, reject: Function }> = new Map();
  private messageId = 1;
  
  constructor(config: HomeAssistantConnectionConfig) {
    this.config = config;
    
    // Create HTTP client with authentication
    this.httpClient = axios.create({
      baseURL: this.config.host,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
  }
  
  /**
   * Connect to Home Assistant via both HTTP and WebSocket
   */
  async connect(): Promise<ConnectionResult> {
    try {
      // Test HTTP connection
      await this.httpClient.get('/api');
      
      // Setup WebSocket connection
      return new Promise((resolve) => {
        try {
          this.wsClient = new WebSocket(this.config.socketUrl);
          
          this.wsClient.on('open', () => {
            // Send authentication message
            this.wsClient?.send(JSON.stringify({
              type: 'auth',
              access_token: this.config.token
            }));
          });
          
          this.wsClient.on('message', (data: WebSocket.Data) => {
            const message = JSON.parse(data.toString());
            
            // Handle authentication response
            if (message.type === 'auth_ok') {
              this.connected = true;
              resolve({ success: true });
            } else if (message.type === 'auth_invalid') {
              this.connected = false;
              resolve({ 
                success: false, 
                error: new Error(`Authentication failed: ${message.message}`) 
              });
            } else if (message.type === 'result' && message.id) {
              // Handle response to a specific message
              const requestPromise = this.messageQueue.get(message.id);
              if (requestPromise) {
                if (message.success) {
                  requestPromise.resolve(message.result);
                } else {
                  requestPromise.reject(new Error(message.error?.message || 'Unknown error'));
                }
                this.messageQueue.delete(message.id);
              }
            }
          });
          
          this.wsClient.on('error', (error) => {
            this.connected = false;
            resolve({ success: false, error });
          });
          
          this.wsClient.on('close', () => {
            this.connected = false;
          });
        } catch (error) {
          resolve({ success: false, error: error as Error });
        }
      });
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
  
  /**
   * Disconnect from Home Assistant
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }
  }
  
  /**
   * Check if connected to Home Assistant
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Get Home Assistant version
   */
  async getVersion(): Promise<string> {
    try {
      const response = await this.httpClient.get('/api');
      return response.data.version;
    } catch (error) {
      throw new Error(`Failed to get Home Assistant version: ${error}`);
    }
  }
  
  /**
   * Send a WebSocket message and get response
   */
  async sendMessage(type: string, payload: Record<string, any> = {}): Promise<any> {
    if (!this.wsClient || !this.connected) {
      throw new Error('Not connected to Home Assistant');
    }
    
    const id = this.messageId++;
    const message = {
      id,
      type,
      ...payload
    };
    
    return new Promise((resolve, reject) => {
      this.messageQueue.set(id, { resolve, reject });
      this.wsClient?.send(JSON.stringify(message));
      
      // Set timeout for message response
      setTimeout(() => {
        if (this.messageQueue.has(id)) {
          this.messageQueue.delete(id);
          reject(new Error(`Request timeout for message type ${type}`));
        }
      }, 30000);
    });
  }
  
  /**
   * Get all entity states
   */
  async getStates(): Promise<any[]> {
    try {
      // Try WebSocket first
      if (this.connected && this.wsClient) {
        return await this.sendMessage('get_states');
      }
      
      // Fall back to HTTP API
      const response = await this.httpClient.get('/api/states');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get entity states: ${error}`);
    }
  }
  
  /**
   * Call a service
   */
  async callService(domain: string, service: string, data: Record<string, any> = {}): Promise<any> {
    try {
      // Try WebSocket first
      if (this.connected && this.wsClient) {
        return await this.sendMessage('call_service', {
          domain,
          service,
          service_data: data
        });
      }
      
      // Fall back to HTTP API
      const response = await this.httpClient.post(
        `/api/services/${domain}/${service}`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to call service ${domain}.${service}: ${error}`);
    }
  }
}