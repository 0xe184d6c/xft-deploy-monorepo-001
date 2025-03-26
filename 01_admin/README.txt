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
