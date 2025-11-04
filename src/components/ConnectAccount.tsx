import React from "react";
import { NETWORK_PASSPHRASE } from "../util/contract";
import FundAccountButton from "./FundAccountButton";
import { WalletButton } from "./WalletButton";
import NetworkPill from "./NetworkPill";

const ConnectAccount: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "10px",
        verticalAlign: "middle",
      }}
    >
      <WalletButton />
      {NETWORK_PASSPHRASE !== "Public Global Stellar Network ; September 2015" && <FundAccountButton />}
      <NetworkPill />
    </div>
  );
};

export default ConnectAccount;
