# AaveSwap

This project contains scripts to interact with the Aave Protocol and execute `deposit`, `borrow` and `repay` operations.

### Project Setup

- Create a `.env` file using `.env.example.
    ```shell
    cp .env.example .env
    ```
  Update the `MAINNET_RPC_URL`. (You can get one using [Infura](https://infura.io/) or [Alchemy](https://www.alchemy.com/))
- Install dependencies:
    ```shell
    yarn install
    ```
- Compile the project to generate types for the smart contracts:
    ```shell
    yarn hardhat compile
    ```
- Run the script:
    ```shell
    yarn hardhat run scripts/aave.ts
    ```