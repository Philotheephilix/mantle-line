import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MNTPriceOracleModule", (m) => {
  // Get the submitter address from parameters, or use the deployer as default
  const submitterAddress = m.getParameter("submitterAddress", m.getAccount(0));

  // Deploy the MNTPriceOracle contract
  const oracle = m.contract("MNTPriceOracle", [submitterAddress]);

  return { oracle };
});

