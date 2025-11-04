import { NETWORK_PASSPHRASE } from "../util/contract";

// Utility to get correct Friendbot URL based on environment
export function getFriendbotUrl(address: string) {
  switch (NETWORK_PASSPHRASE) {
    case "Standalone Network ; February 2017":
      // Use proxy in development for local
      return `/friendbot?addr=${address}`;
    case "Test SDF Future Network ; October 2022":
      return `https://friendbot-futurenet.stellar.org/?addr=${address}`;
    case "Test SDF Network ; September 2015":
      return `https://friendbot.stellar.org/?addr=${address}`;
    default:
      throw new Error(
        `Unknown or unsupported PUBLIC_STELLAR_NETWORK for friendbot: ${NETWORK_PASSPHRASE}`,
      );
  }
}
