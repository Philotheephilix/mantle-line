import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LineFuturesModule", (m) => {
  // Get the PnL server address from parameters, or use the deployer as default
  const pnlServerAddress = m.getParameter("pnlServerAddress", m.getAccount(0));
  
  // Get the MNTPriceOracle address from parameters (required)
  const mntPriceOracleAddress = m.getParameter("mntPriceOracleAddress", "0xb54bb2Dea54c1f9ebc169561b5Db76f27f99C118");

  // Deploy the LineFutures contract
  const lineFutures = m.contract("LineFutures", [pnlServerAddress, mntPriceOracleAddress]);

  return { lineFutures };
});

