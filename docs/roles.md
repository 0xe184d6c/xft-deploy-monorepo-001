# USDX Token Roles

USDX token uses role-based access control for administrative functions.

## Available Roles

| Role                | Hash                                                             | Description                        |
|---------------------|------------------------------------------------------------------|------------------------------------|
| DEFAULT_ADMIN_ROLE  | 0x0000000000000000000000000000000000000000000000000000000000000000 | Admin role, can grant other roles |
| MINTER_ROLE         | 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 | Can mint new tokens               |
| BURNER_ROLE         | 0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848 | Can burn tokens                   |
| BLOCKLIST_ROLE      | 0x611a95f11861709d90869a3a6c418538cfd770d4a6fc7c5d42c8d3e29095275 | Can block/unblock accounts        |
| ORACLE_ROLE         | 0x68bcdf4ad02712acfee63674134406c11a0ec5ca3d115a6c010ba4dde195f803 | Can update reward multiplier      |
| UPGRADE_ROLE        | 0x189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3 | Can upgrade contract              |
| PAUSE_ROLE          | 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a | Can pause/unpause contract        |

## Role Management

Roles can be granted or revoked using the API:

```
POST /api/grant-role
POST /api/revoke-role
```

Check if an account has a role:

```
GET /api/has-role/:account/:role
```