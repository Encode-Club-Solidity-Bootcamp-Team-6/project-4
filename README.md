# project-4
Code repo for week 4 group project


## backend

- Start by running in terminal: `npm run start:dev`.

## frontend

- Start by running in terminal: `yarn start`.


## NestJS config mode (backend)

This code uses the NestJS config mode to load e.g. RPC URL and PRIVATE KEY. Explanations for this mode see: https://github.com/Encode-Club-Solidity-Bootcamp/Lesson-15?tab=readme-ov-file#using-nestjs-configurations-module

The code combines RPC URL and API form .env file to RpcEndpointUrl (see backend > app.service.ts). The classical load form env w/ dotenv is still in the code though.


Syntax info for RpcEndpointUrl from env:

INFURA_RPC_URL="https://sepolia.infura.io/v3/"
+
INFURA_API_KEY="API-KEY"
