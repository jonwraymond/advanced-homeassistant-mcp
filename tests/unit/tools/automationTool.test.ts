import { AutomationTool } from '../../../src/tools/automationTool';
import { AutomationService } from '../../../src/services/automationService';

// Mock the automation service
jest.mock('../../../src/services/automationService');

describe('AutomationTool', () => {
  let automationTool: AutomationTool;
  let mockAutomationService: jest.Mocked<AutomationService>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock automation service
    mockAutomationService = new AutomationService(null as any) as jest.Mocked<AutomationService>;
    
    // Initialize automation tool
    automationTool = new AutomationTool(mockAutomationService);
  });
  
  test('should provide manifest with correct name, description and parameters', () => {
    // Act
    const manifest = automationTool.getManifest();
    
    // Assert
    expect(manifest.name).toBe('automation');
    expect(manifest.description).toBeDefined();
    expect(manifest.parameters).toBeDefined();
    expect(manifest.parameters.type).toBe('object');
    expect(manifest.parameters.properties.action).toBeDefined();
    expect(manifest.parameters.required).toContain('action');
  });
  
  test('should list automations', async () => {
    // Arrange
    const mockAutomations = [
      { id: 'automation.night_light', alias: 'Night Light' },
      { id: 'automation.morning_routine', alias: 'Morning Routine' }
    ];
    mockAutomationService.getAutomations = jest.fn().mockResolvedValue(mockAutomations);
    
    // Act
    const result = await automationTool.handler({
      action: 'list'
    });
    
    // Assert
    expect(mockAutomationService.getAutomations).toHaveBeenCalled();
    expect(result.automations).toEqual(mockAutomations);
  });
  
  test('should create automation', async () => {
    // Arrange
    const mockConfig = {
      alias: 'Test Automation',
      trigger: [{ platform: 'state', entity_id: 'sensor.test', to: 'on' }],
      action: [{ service: 'light.turn_on', target: { entity_id: 'light.test' } }]
    };
    mockAutomationService.createAutomation = jest.fn().mockResolvedValue({ success: true });
    
    // Act
    const result = await automationTool.handler({
      action: 'create',
      config: mockConfig
    });
    
    // Assert
    expect(mockAutomationService.createAutomation).toHaveBeenCalledWith(mockConfig);
    expect(result.success).toBe(true);
  });
  
  test('should update automation', async () => {
    // Arrange
    const automationId = 'automation.test';
    const mockConfig = {
      alias: 'Updated Automation',
      trigger: [{ platform: 'state', entity_id: 'sensor.test', to: 'on' }],
      action: [{ service: 'light.turn_on', target: { entity_id: 'light.test' } }]
    };
    mockAutomationService.updateAutomation = jest.fn().mockResolvedValue({ success: true });
    
    // Act
    const result = await automationTool.handler({
      action: 'update',
      automation_id: automationId,
      config: mockConfig
    });
    
    // Assert
    expect(mockAutomationService.updateAutomation).toHaveBeenCalledWith(automationId, mockConfig);
    expect(result.success).toBe(true);
  });
  
  test('should delete automation', async () => {
    // Arrange
    const automationId = 'automation.test';
    mockAutomationService.deleteAutomation = jest.fn().mockResolvedValue({ success: true });
    
    // Act
    const result = await automationTool.handler({
      action: 'delete',
      automation_id: automationId
    });
    
    // Assert
    expect(mockAutomationService.deleteAutomation).toHaveBeenCalledWith(automationId);
    expect(result.success).toBe(true);
  });
  
  test('should trigger automation', async () => {
    // Arrange
    const automationId = 'automation.test';
    mockAutomationService.triggerAutomation = jest.fn().mockResolvedValue({ success: true });
    
    // Act
    const result = await automationTool.handler({
      action: 'trigger',
      automation_id: automationId
    });
    
    // Assert
    expect(mockAutomationService.triggerAutomation).toHaveBeenCalledWith(automationId);
    expect(result.success).toBe(true);
  });
  
  test('should toggle automation', async () => {
    // Arrange
    const automationId = 'automation.test';
    mockAutomationService.toggleAutomation = jest.fn().mockResolvedValue({ success: true });
    
    // Act
    const result = await automationTool.handler({
      action: 'toggle',
      automation_id: automationId
    });
    
    // Assert
    expect(mockAutomationService.toggleAutomation).toHaveBeenCalledWith(automationId);
    expect(result.success).toBe(true);
  });
  
  test('should handle errors', async () => {
    // Arrange
    mockAutomationService.getAutomations = jest.fn().mockRejectedValue(new Error('Service error'));
    
    // Act
    const result = await automationTool.handler({
      action: 'list'
    });
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Service error');
  });
  
  test('should handle invalid action', async () => {
    // Act
    const result = await automationTool.handler({
      action: 'invalid_action' as any
    });
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid action');
  });
});