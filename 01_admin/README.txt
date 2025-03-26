chmod +x 01_admin/backup.sh
./01_admin/backup.sh

Public and External Functions
Private and Internal Functions
Events
Roles




Dataflow: ABI JSON input → Validate → Parse functions & types → Map stateMutability to HTTP method → Convert types to JSON schema → Generate OpenAPI spec JSON → Return spec

User Flow:
1.	User submits ABI JSON via POST /generateSpec
2.	Server validates and parses ABI
3.	Server generates and returns corresponding OpenAPI spec
4.	User receives spec for integration with OpenAPI tools

RESPONSE
List of endpoints
Plain text of OpenAPI spec truncated 



SERVER
index.js
/src backend + api logic
/public frontend 

BACKEND

src/api/
routes
middleware
services




Parse ABI JSON:
Extract function definitions
Identify view/pure vs state-changing functions
Capture input/output parameters and types
Map to REST endpoints:
View functions -> GET endpoints
State-changing -> POST endpoints
Events -> Webhook endpoints
Parameters become request/response schema
Generate OpenAPI/Swagger:
Paths from functions
Components from types
Authentication from roles
Error responses from reverts
Create API routes:
Map GET routes to contract reads
Map POST routes to contract writes
Add validation middleware
Handle gas/transaction details
The ABI essentially becomes the source of truth for the entire API structure.



Project Files and Their Use Cases
Here's a list of the main project files and their functions:

index.js

Main entry point for the Node.js application
Sets up the Express server and middleware
Configures error handling and routes
Starts the server on port 8000

src/abiParser.js

Parses Ethereum ABI JSON structures
Extracts function definitions, parameters, and types
Builds function signatures and determines appropriate HTTP methods

src/apiGenerator.js
Generates OpenAPI specifications from parsed ABI data
Maps ABI functions to OpenAPI paths and components
Creates schema definitions for inputs and outputs

src/validators.js
Validates ABI JSON structure before processing
Ensures required fields are present and data types are correct
Returns detailed validation errors when issues are found

src/utils.js
Provides utility functions for Solidity to JSON Schema conversion
Handles complex array structures recursively
Formats numbers for JSON output

src/routes.js
Defines API endpoints including /generateSpec
Handles route registration and request processing
Implements documentation routes and health checks

public/index.html
Frontend interface for the application
Allows users to input ABI JSON and view OpenAPI output

public/script.js
Client-side JavaScript for the web interface
Handles form submission and API communication

public/style.css
Styling for the web interface
Ensures responsive design and visual appeal

package.json & package-lock.json
Defines project dependencies and scripts
Locks dependency versions for consistent installations
The project is now a clean Node.js application focused on converting Ethereum ABIs to OpenAPI specifications, with all Python references removed.



Contract functions handle:
Token transfers
Minting/burning
Role management
Account blocking
Contract pausing
Event monitoring


