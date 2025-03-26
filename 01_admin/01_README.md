
HOW TO BUILD API FROM ABI

Client sends API request per OpenAPI spec
API server converts request into blockchain call
If a proxy exists, call goes to proxy
Proxy delegates call to implementation contract
Blockchain returns result to API server, then to client