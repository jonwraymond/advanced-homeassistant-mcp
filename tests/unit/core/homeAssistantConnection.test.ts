import { HomeAssistantConnection } from '../../../src/core/homeAssistantConnection';
import { mockHomeAssistantServer } from '../../mocks/mockHomeAssistantServer';

// Start the mock server before tests
beforeAll(async () => {
  await mockHomeAssistantServer.start();
});

// Stop the mock server after tests
afterAll(async () => {
  await mockHomeAssistantServer.stop();
});

describe('HomeAssistantConnection', () => {
  
  test('should successfully connect to Home Assistant', async () => {
    // Arrange
    const connection = new HomeAssistantConnection({
      host: 'http://localhost:8123',
      token: 'mock_token',
      socketUrl: 'ws://localhost:8123/api/websocket'
    });
    
    // Act
    const result = await connection.connect();
    
    // Assert
    expect(result.success).toBe(true);
    expect(connection.isConnected()).toBe(true);
  });
  
  test('should fail to connect with invalid host', async () => {
    // Arrange
    const connection = new HomeAssistantConnection({
      host: 'http://nonexistent-host:8123',
      token: 'mock_token',
      socketUrl: 'ws://nonexistent-host:8123/api/websocket'
    });
    
    // Act
    const result = await connection.connect();
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(connection.isConnected()).toBe(false);
  });
  
  test('should fail to connect with invalid token', async () => {
    // Arrange
    const connection = new HomeAssistantConnection({
      host: 'http://localhost:8123',
      token: 'invalid_token',
      socketUrl: 'ws://localhost:8123/api/websocket'
    });
    
    // Act
    const result = await connection.connect();
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(connection.isConnected()).toBe(false);
  });
  
  test('should reconnect after disconnection', async () => {
    // Arrange
    const connection = new HomeAssistantConnection({
      host: 'http://localhost:8123',
      token: 'mock_token',
      socketUrl: 'ws://localhost:8123/api/websocket'
    });
    
    // Act
    await connection.connect();
    await connection.disconnect();
    const reconnectResult = await connection.connect();
    
    // Assert
    expect(reconnectResult.success).toBe(true);
    expect(connection.isConnected()).toBe(true);
  });
  
  test('should retrieve Home Assistant version', async () => {
    // Arrange
    const connection = new HomeAssistantConnection({
      host: 'http://localhost:8123',
      token: 'mock_token',
      socketUrl: 'ws://localhost:8123/api/websocket'
    });
    
    // Act
    await connection.connect();
    const version = await connection.getVersion();
    
    // Assert
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
    expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Semver format
  });
});