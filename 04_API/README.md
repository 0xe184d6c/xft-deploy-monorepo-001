# Ethereum API

A JSON REST API for managing Ethereum token information.

## Setup

```bash
cd 04_API
npm install
```

## Running the Server

```bash
npm start
```

The server will run on port 5000.

## API Endpoints

### GET /tokens
- Get all tokens

### GET /tokens/:id
- Get a specific token by ID

### POST /tokens
- Create a new token
- Body: `{ "name": "Token Name", "symbol": "TKN", "decimals": 18, "totalSupply": "1000000000000000000000000" }`

### PUT /tokens/:id
- Update an existing token
- Body: `{ "totalSupply": "2000000000000000000000000" }`

### DELETE /tokens/:id
- Delete a token

## Test Scripts

Run these scripts in separate terminal while the server is running:

### Create a token
```bash
node scripts/create-token.js
```

### Get all tokens
```bash
node scripts/get-tokens.js
```

### Update a token
```bash
node scripts/update-token.js
```

### Delete a token
```bash
node scripts/delete-token.js
```