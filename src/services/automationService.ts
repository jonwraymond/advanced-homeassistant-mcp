import { HomeAssistantConnection } from '../core/homeAssistantConnection';

interface Trigger {
  platform: string;
  [key: string]: any;
}

interface Condition {
  condition: string;
  [key: string]: any;
}

interface Action {
  service: string;
  target?: {
    entity_id: string | string[];
  };
  data?: Record<string, any>;
  [key: string]: any;
}

export interface Automation {
  id?: string;
  alias: string;
  description?: string;
  trigger: Trigger[];
  condition?: Condition[];
  action: Action[];
  mode?: 'single' | 'parallel' | 'queued' | 'restart';
  max?: number;
  [key: string]: any;
}

export interface ServiceResult {
  success: boolean;
  error?: string;
}

export class AutomationService {
  private connection: HomeAssistantConnection;
  
  constructor(connection: HomeAssistantConnection) {
    this.connection = connection;
  }
  
  /**
   * Get list of all automations
   */
  async getAutomations(): Promise<Automation[]> {
    this.checkConnection();
    
    try {
      const automations = await this.connection.sendMessage('config/automation/list');
      return automations;
    } catch (error) {
      throw new Error(`Failed to get automations: ${error}`);
    }
  }
  
  /**
   * Create a new automation
   */
  async createAutomation(config: Automation): Promise<ServiceResult> {
    this.checkConnection();
    
    try {
      await this.connection.sendMessage('config/automation/config', { config });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to create automation: ${error}` 
      };
    }
  }
  
  /**
   * Update an existing automation
   */
  async updateAutomation(automationId: string, config: Automation): Promise<ServiceResult> {
    this.checkConnection();
    
    try {
      await this.connection.sendMessage('config/automation/config', {
        automation_id: automationId,
        config
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to update automation ${automationId}: ${error}` 
      };
    }
  }
  
  /**
   * Delete an automation
   */
  async deleteAutomation(automationId: string): Promise<ServiceResult> {
    this.checkConnection();
    
    try {
      await this.connection.sendMessage('config/automation/delete', {
        automation_id: automationId
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to delete automation ${automationId}: ${error}` 
      };
    }
  }
  
  /**
   * Trigger an automation to run
   */
  async triggerAutomation(automationId: string): Promise<ServiceResult> {
    this.checkConnection();
    
    try {
      await this.connection.callService('automation', 'trigger', {
        entity_id: automationId
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to trigger automation ${automationId}: ${error}` 
      };
    }
  }
  
  /**
   * Toggle an automation on/off
   */
  async toggleAutomation(automationId: string): Promise<ServiceResult> {
    this.checkConnection();
    
    try {
      await this.connection.callService('automation', 'toggle', {
        entity_id: automationId
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to toggle automation ${automationId}: ${error}` 
      };
    }
  }
  
  /**
   * Check if connected to Home Assistant
   */
  private checkConnection(): void {
    if (!this.connection.isConnected()) {
      throw new Error('Not connected to Home Assistant');
    }
  }
}