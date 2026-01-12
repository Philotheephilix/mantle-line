import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LineFuturesModule", (m) => {
  // Get the PnL server address from parameters, or use the deployer as default
  const pnlServerAddress = m.getParameter("pnlServerAddress", m.getAccount(0));
  
  // Get the MNTPriceOracle address from parameters (required)
  const mntPriceOracleAddress = "0xB4Aa6814Ad2EA5DE6feC8Af4f129FfA6777db235";

  // Deploy the LineFutures contract
  const lineFutures = m.contract("LineFutures", [pnlServerAddress, mntPriceOracleAddress]);

  return { lineFutures };
});

