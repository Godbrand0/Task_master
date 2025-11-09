import * as Client from "./src/index";
import { rpcUrl } from "./util.ts";

export default new Client.Client({
  networkPassphrase: "Standalone Network ; February 2017",
  contractId: "CD4JTVBF326WSZZ7RXQZTVUM6T5XKOMWPAKBBEFVJCXXYVBTHRZPGO6A",
  rpcUrl,
  allowHttp: true,
  publicKey: undefined,
});
