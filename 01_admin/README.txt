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