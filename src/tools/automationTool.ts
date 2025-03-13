import { AutomationService, Automation, ServiceResult } from '../services/automationService';

interface AutomationToolInput {
  action: 'list' | 'create' | 'update' | 'delete' | 'trigger' | 'toggle';
  automation_id?: string;
  config?: Automation;
}

interface AutomationToolOutput {
  success: boolean;
  automations?: Automation[];
  error?: string;
}

export class AutomationTool {
  private automationService: AutomationService;
  
  constructor(automationService: AutomationService) {
    this.automationService = automationService;
  }
  
  /**
   * Get the tool manifest for MCP
   */
  getManifest() {
    return {
      name: 'automation',
      description: 'Manages Home Assistant automations',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'create', 'update', 'delete', 'trigger', 'toggle'],
            description: 'Action to perform'
          },
          automation_id: {
            type: 'string',
            description: 'ID of the automation (required for update, delete, trigger, toggle)'
          },
          config: {
            type: 'object',
            description: 'Automation configuration (required for create, update)',
            properties: {
              alias: { type: 'string' },
              description: { type: 'string' },
              trigger: { type: 'array' },
              condition: { type: 'array' },
              action: { type: 'array' },
              mode: { type: 'string' }
            },
            required: ['alias', 'trigger', 'action']
          }
        },
        required: ['action']
      }
    };
  }
  
  /**
   * Handle tool request
   */
  async handler(input: AutomationToolInput): Promise<AutomationToolOutput> {
    try {
      switch (input.action) {
        case 'list':
          return this.handleList();
        case 'create':
          return this.handleCreate(input.config);
        case 'update':
          return this.handleUpdate(input.automation_id, input.config);
        case 'delete':
          return this.handleDelete(input.automation_id);
        case 'trigger':
          return this.handleTrigger(input.automation_id);
        case 'toggle':
          return this.handleToggle(input.automation_id);
        default:
          return {
            success: false,
            error: `Invalid action: ${input.action}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Handle list action
   */
  private async handleList(): Promise<AutomationToolOutput> {
    const automations = await this.automationService.getAutomations();
    return {
      success: true,
      automations
    };
  }
  
  /**
   * Handle create action
   */
  private async handleCreate(config?: Automation): Promise<AutomationToolOutput> {
    if (!config) {
      return {
        success: false,
        error: 'Missing config parameter'
      };
    }
    
    const result = await this.automationService.createAutomation(config);
    return this.formatResult(result);
  }
  
  /**
   * Handle update action
   */
  private async handleUpdate(automationId?: string, config?: Automation): Promise<AutomationToolOutput> {
    if (!automationId) {
      return {
        success: false,
        error: 'Missing automation_id parameter'
      };
    }
    
    if (!config) {
      return {
        success: false,
        error: 'Missing config parameter'
      };
    }
    
    const result = await this.automationService.updateAutomation(automationId, config);
    return this.formatResult(result);
  }
  
  /**
   * Handle delete action
   */
  private async handleDelete(automationId?: string): Promise<AutomationToolOutput> {
    if (!automationId) {
      return {
        success: false,
        error: 'Missing automation_id parameter'
      };
    }
    
    const result = await this.automationService.deleteAutomation(automationId);
    return this.formatResult(result);
  }
  
  /**
   * Handle trigger action
   */
  private async handleTrigger(automationId?: string): Promise<AutomationToolOutput> {
    if (!automationId) {
      return {
        success: false,
        error: 'Missing automation_id parameter'
      };
    }
    
    const result = await this.automationService.triggerAutomation(automationId);
    return this.formatResult(result);
  }
  
  /**
   * Handle toggle action
   */
  private async handleToggle(automationId?: string): Promise<AutomationToolOutput> {
    if (!automationId) {
      return {
        success: false,
        error: 'Missing automation_id parameter'
      };
    }
    
    const result = await this.automationService.toggleAutomation(automationId);
    return this.formatResult(result);
  }
  
  /**
   * Format service result to tool output
   */
  private formatResult(result: ServiceResult): AutomationToolOutput {
    return {
      success: result.success,
      error: result.error
    };
  }
}