import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config"

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || ""

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.10"
            },
            {
                version: "0.4.19"
            },
            {
                version: "0.6.12"
            }
        ]
    },
    networks: {
        hardhat: {
            chainId: 31337,
            forking: {
                url: MAINNET_RPC_URL,
            },
        }
    }
}

export default config;
