import { AutomationService } from '../../../src/services/automationService';
import { HomeAssistantConnection } from '../../../src/core/homeAssistantConnection';
import { mockHomeAssistantServer } from '../../mocks/mockHomeAssistantServer';

// Mock the Home Assistant connection
jest.mock('../../../src/core/homeAssistantConnection');

describe('AutomationService', () => {
  let automationService: AutomationService;
  let mockConnection: jest.Mocked<HomeAssistantConnection>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a mock connection
    mockConnection = new HomeAssistantConnection({
      host: 'http://localhost:8123',
      token: 'mock_token',
      socketUrl: 'ws://localhost:8123/api/websocket'
    }) as jest.Mocked<HomeAssistantConnection>;
    
    // Mock connection methods
    mockConnection.isConnected = jest.fn().mockReturnValue(true);
    mockConnection.callService = jest.fn().mockResolvedValue({ success: true });
    mockConnection.sendMessage = jest.fn().mockImplementation((type, payload) => {
      if (type === 'config/automation/list') {
        return Promise.resolve([
          {
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
          }
        ]);
      }
      if (type === 'config/automation/config') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve([]);
    });
    
    // Create automation service with mock connection
    automationService = new AutomationService(mockConnection);
  });
  
  test('should get list of automations', async () => {
    // Act
    const automations = await automationService.getAutomations();
    
    // Assert
    expect(mockConnection.sendMessage).toHaveBeenCalledWith('config/automation/list');
    expect(automations).toHaveLength(1);
    expect(automations[0].id).toBe('automation.night_light');
    expect(automations[0].alias).toBe('Night Light');
  });
  
  test('should create new automation', async () => {
    // Arrange
    const newAutomation = {
      alias: 'Motion Light',
      description: 'Turn on light when motion detected',
      trigger: [
        {
          platform: 'state',
          entity_id: 'binary_sensor.motion',
          to: 'on'
        }
      ],
      condition: [],
      action: [
        {
          service: 'light.turn_on',
          target: {
            entity_id: 'light.hallway'
          }
        }
      ],
      mode: 'single'
    };
    
    // Act
    const result = await automationService.createAutomation(newAutomation);
    
    // Assert
    expect(mockConnection.sendMessage).toHaveBeenCalledWith(
      'config/automation/config',
      { config: newAutomation }
    );
    expect(result.success).toBe(true);
  });
  
  test('should update existing automation', async () => {
    // Arrange
    const automationId = 'automation.night_light';
    const updatedConfig = {
      alias: 'Night Light',
      description: 'Turn on lights at sunset with brightness control',
      trigger: [
        {
          platform: 'sun',
          event: 'sunset',
          offset: '+00:15:00' // Changed from 30 min to 15 min
        }
      ],
      condition: [],
      action: [
        {
          service: 'light.turn_on',
          target: {
            entity_id: 'light.living_room'
          },
          data: {
            brightness: 128 // Added brightness control
          }
        }
      ],
      mode: 'single'
    };
    
    // Act
    const result = await automationService.updateAutomation(automationId, updatedConfig);
    
    // Assert
    expect(mockConnection.sendMessage).toHaveBeenCalledWith(
      'config/automation/config',
      { 
        automation_id: automationId,
        config: updatedConfig
      }
    );
    expect(result.success).toBe(true);
  });
  
  test('should delete automation', async () => {
    // Arrange
    const automationId = 'automation.night_light';
    
    // Act
    const result = await automationService.deleteAutomation(automationId);
    
    // Assert
    expect(mockConnection.sendMessage).toHaveBeenCalledWith(
      'config/automation/delete',
      { automation_id: automationId }
    );
    expect(result.success).toBe(true);
  });
  
  test('should trigger automation', async () => {
    // Arrange
    const automationId = 'automation.night_light';
    
    // Act
    const result = await automationService.triggerAutomation(automationId);
    
    // Assert
    expect(mockConnection.callService).toHaveBeenCalledWith(
      'automation', 
      'trigger', 
      { entity_id: automationId }
    );
    expect(result.success).toBe(true);
  });
  
  test('should toggle automation', async () => {
    // Arrange
    const automationId = 'automation.night_light';
    
    // Act
    const result = await automationService.toggleAutomation(automationId);
    
    // Assert
    expect(mockConnection.callService).toHaveBeenCalledWith(
      'automation', 
      'toggle', 
      { entity_id: automationId }
    );
    expect(result.success).toBe(true);
  });
  
  test('should handle connection errors', async () => {
    // Arrange
    mockConnection.isConnected = jest.fn().mockReturnValue(false);
    
    // Act & Assert
    await expect(automationService.getAutomations())
      .rejects
      .toThrow('Not connected to Home Assistant');
  });
  
  test('should handle API errors', async () => {
    // Arrange
    mockConnection.sendMessage = jest.fn().mockRejectedValue(new Error('API Error'));
    
    // Act & Assert
    await expect(automationService.getAutomations())
      .rejects
      .toThrow('Failed to get automations: API Error');
  });
});