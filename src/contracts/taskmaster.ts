import * as Client from 'taskmaster';
import { rpcUrl } from '../util/contract';

export default new Client.Client({
  networkPassphrase: 'Standalone Network ; February 2017',
  contractId: 'CB5VFJOJW627XHLTWTB4OEE2FT3C4EHY7IUDZU62CLEVUODYLWVG4AQO',
  rpcUrl,
  allowHttp: true,
  publicKey: undefined,
});
