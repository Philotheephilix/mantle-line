import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    mantleSepolia: {
      type: "http",
      chainType: "l1",
      url: "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: [configVariable("MANTLE_SEPOLIA_PRIVATE_KEY")],
    },
    mantle: {
      type: "http",
      chainType: "l1",
      url: "https://rpc.mantle.xyz",
      chainId: 5000,
      accounts: [configVariable("MANTLE_PRIVATE_KEY")],
    },
  },
});
