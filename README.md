# Fizzy CLI

A command-line tool for interacting with [Fizzy's](https://fizzy.pm) API.

## Installation

```bash
npm install
npm link  # Makes 'fizzy' command available globally
```

## Configuration

First, get an API token from your Fizzy profile's API section, then configure the CLI:

```bash
# Set your API token
fizzy config set-token YOUR_API_TOKEN

# Set your default account slug
fizzy config set-account your-account-slug

# View current configuration
fizzy config show
```

## Usage

### Identity

```bash
# Get your identity and accessible accounts
fizzy identity
fizzy me  # alias
```

### Boards

```bash
# List all boards
fizzy boards list
fizzy boards ls

# Show board details
fizzy boards show <board-id>

# Create a new board
fizzy boards create "My Board" --description "Board description"

# Update a board
fizzy boards update <board-id> --name "New Name" --description "New description"

# Delete a board
fizzy boards delete <board-id>
```

### Cards

```bash
# List cards (with optional filters)
fizzy cards list
fizzy cards list --board <board-id>
fizzy cards list --status open
fizzy cards list --column <column-id>
fizzy cards list --assignee <user-id>

# Show card details
fizzy cards show <card-number>

# Create a card
fizzy cards create <board-id> "Card title" --description "Card content"
fizzy cards create <board-id> "Card title" --column <column-id>

# Update a card
fizzy cards update <card-number> --title "New title"
fizzy cards update <card-number> --column <column-id>

# Close/reopen a card
fizzy cards close <card-number>
fizzy cards reopen <card-number>

# Delete a card
fizzy cards delete <card-number>
```

### Comments

```bash
# List comments on a card
fizzy cards comments <card-number>

# Add a comment
fizzy cards comment <card-number> "My comment text"
```

### JSON Output

All commands support `--json` flag for machine-readable output:

```bash
fizzy boards list --json
fizzy cards show 42 --json
```

## API Reference

This CLI wraps the [Fizzy API](https://github.com/basecamp/fizzy/blob/main/docs/API.md). The following endpoints are supported:

- **Identity**: `GET /my/identity`
- **Boards**: Full CRUD operations
- **Cards**: Full CRUD + close/reopen + comments
- **Comments**: List and create

## File Structure

```
fizzy-cli/
├── bin/
│   └── fizzy.js          # CLI entry point
├── src/
│   ├── commands/
│   │   ├── boards.js     # Board commands
│   │   ├── cards.js      # Card commands
│   │   ├── config.js     # Configuration commands
│   │   └── identity.js   # Identity command
│   └── lib/
│       ├── api.js        # Fizzy API client
│       ├── config.js     # Configuration management
│       └── output.js     # Output formatting utilities
├── package.json
└── README.md
```

## License

MIT
