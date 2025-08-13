# Spotlight Sidecar

The Spotlight Sidecar is a small proxy server that allows (development) servers to send data to Spotlight.

## Installation

```js
npm install @spotlightjs/sidecar
```

## Usage

### As a Library

```js
import { setupSidecar } from '@spotlightjs/sidecar';

// When you start your dev server
setupSidecar();
```

### As a CLI

```bash
# Start with default settings (port 8969)
spotlight-sidecar

# Start on a custom port
spotlight-sidecar --port 3000
# or
spotlight-sidecar -p 3000

# Enable debug logging
spotlight-sidecar --debug
# or
spotlight-sidecar -d

# Combine options
spotlight-sidecar --port 3000 --debug

# Show help
spotlight-sidecar --help
```

### CLI Options

- `-p, --port <port>` - Port to listen on (default: 8969)
- `-d, --debug` - Enable debug logging
- `-h, --help` - Show help message
