# Advanced Home Assistant MCP Server with Test-Driven Development

[![Test](https://github.com/jonwraymond/advanced-homeassistant-mcp/actions/workflows/test.yml/badge.svg)](https://github.com/jonwraymond/advanced-homeassistant-mcp/actions/workflows/test.yml)

A powerful bridge between your Home Assistant instance and Language Learning Models (LLMs), enabling natural language control and monitoring of your smart home devices through the Model Context Protocol (MCP). This implementation follows test-driven development principles, ensuring high reliability and code quality.

## Features

- 🧪 **Test-Driven Development**: All features built using TDD approach
- 🐳 **Docker Integration**: Containerized testing environment
- 🤖 **Automation Management**: Create, update, and manage automations
- 🔌 **Device Control**: Control Home Assistant devices through natural language
- 📊 **State Monitoring**: Track and query device states
- 🔐 **Secure**: Token-based authentication
- 🎮 **MCP Tools**: Automation management through standardized MCP interfaces

## Test-Driven Development Approach

This project follows a rigorous test-driven development cycle:

1. **Write Tests First**: All functionality is defined through tests before implementation
2. **Red-Green-Refactor**: Tests guide implementation, ensuring all code is tested
3. **Mocking**: Mock Home Assistant server for testing without a real instance
4. **Docker Testing**: Containerized testing environment for consistency
5. **CI/CD Integration**: GitHub Actions for automated testing on every push

## Project Structure

```
home-assistant-mcp/
├── src/
│   ├── core/              # Core functionality
│   │   └── homeAssistantConnection.ts
│   ├── services/          # Service implementations
│   │   └── automationService.ts
│   ├── tools/             # MCP tools
│   │   └── automationTool.ts
│   ├── controllers/       # API controllers
│   ├── models/            # Data models
│   ├── utils/             # Utility functions
│   └── index.ts           # Main entry point
├── tests/
│   ├── unit/             # Unit tests
│   │   ├── core/
│   │   ├── services/ 
│   │   └── tools/
│   ├── integration/      # Integration tests
│   ├── e2e/              # End-to-end tests
│   └── mocks/            # Test mocks
│       └── mockHomeAssistantServer.ts
├── docker/
│   ├── Dockerfile.test   # Testing Dockerfile
│   └── Dockerfile.mockha # Mock Home Assistant Dockerfile
├── .github/
│   └── workflows/        # GitHub Actions workflows
│       └── test.yml      # CI testing pipeline
├── scripts/
│   └── run-tests-in-docker.sh # Script to run tests in Docker
├── docker-compose.test.yml    # Docker Compose for testing
├── package.json               # Node.js dependencies
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest testing configuration
└── README.md                  # Project documentation
```

## Prerequisites

- **Node.js** 20+ or **Bun** runtime
- **Docker** (for containerized testing)
- A running **Home Assistant** instance
- Home Assistant long-lived access token

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/jonwraymond/advanced-homeassistant-mcp.git
cd advanced-homeassistant-mcp

# Install dependencies
npm install

# Or with Bun
bun install
```

### Running Tests

```bash
# Run tests locally
npm test

# Run tests in Docker (recommended)
chmod +x scripts/run-tests-in-docker.sh
./scripts/run-tests-in-docker.sh

# Run tests with coverage
npm run test:coverage
```

### Running the Server

```bash
# Build the project
npm run build

# Start the server
npm start

# Development mode
npm run dev
```

## Configuration

Create a `.env` file with the following variables:

```env
# Home Assistant Configuration
HASS_HOST=http://homeassistant.local:8123
HASS_TOKEN=your_long_lived_access_token
HASS_SOCKET_URL=ws://homeassistant.local:8123/api/websocket

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Using with MCP Clients

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "homeassistant": {
      "command": "npm",
      "args": ["run", "start"],
      "cwd": "path/to/advanced-homeassistant-mcp",
      "env": {
        "HASS_HOST": "http://homeassistant.local:8123",
        "HASS_TOKEN": "your_long_lived_access_token",
        "HASS_SOCKET_URL": "ws://homeassistant.local:8123/api/websocket"
      }
    }
  }
}
```

## API Endpoints

### MCP Endpoint

```http
POST /mcp
```

Receives MCP tool requests and routes them to the appropriate handler.

**Request Body:**
```json
{
  "tool": "automation",
  "action": "list"
}
```

### Health Check

```http
GET /health
```

Returns the server status and Home Assistant connection information.

## Adding New Features

To add new features, follow the TDD approach:

1. **Write Tests**: Create test files in `tests/unit/` for your new functionality
2. **Implement Features**: Write the minimum code to make tests pass
3. **Run Tests**: Verify that all tests pass
4. **Refactor**: Improve code quality while maintaining test coverage

## Docker Testing Environment

This project includes a full Docker testing environment with:

- **Mock Home Assistant Server**: Simulates Home Assistant without requiring a real instance
- **Test Container**: Runs tests against the mock server
- **Isolated Network**: Ensures tests run in a clean environment

To use it:

```bash
./scripts/run-tests-in-docker.sh
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b my-new-feature`)
3. Write tests for your new feature
4. Implement your feature to make tests pass
5. Commit your changes (`git commit -am 'Add new feature'`)
6. Push to the branch (`git push origin my-new-feature`)
7. Create a new Pull Request

## License

MIT License - See [LICENSE](LICENSE) file
