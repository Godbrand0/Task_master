import {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { wallet } from "../util/wallet";
import storage from "../util/storage";
import { taskMasterService } from "../services/taskmaster";
import { UserProfile } from "../types/user";

export interface WalletContextType {
  address?: string;
  network?: string;
  networkPassphrase?: string;
  isPending: boolean;
  signTransaction?: typeof wallet.signTransaction;
  userProfile?: UserProfile | null;
  isProfileLoading?: boolean;
  refreshUserProfile?: () => Promise<void>;
}

const initialState = {
  address: undefined,
  network: undefined,
  networkPassphrase: undefined,
  userProfile: undefined,
  isProfileLoading: false,
};

const POLL_INTERVAL = 10000; // Changed from 1 second to 10 seconds

export const WalletContext = // eslint-disable-line react-refresh/only-export-components
  createContext<WalletContextType>({ isPending: true });

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] =
    useState<Omit<WalletContextType, "isPending">>(initialState);
  const [isPending, startTransition] = useTransition();
  const popupLock = useRef(false);
  const signTransaction = wallet.signTransaction.bind(wallet);

  const nullify = () => {
    updateState(initialState);
    storage.setItem("walletId", "");
    storage.setItem("walletAddress", "");
    storage.setItem("walletNetwork", "");
    storage.setItem("networkPassphrase", "");
  };

  const updateState = (newState: Omit<WalletContextType, "isPending">) => {
    setState((prev: Omit<WalletContextType, "isPending">) => {
      // Only update if something actually changed
      if (
        prev.address !== newState.address ||
        prev.network !== newState.network ||
        prev.networkPassphrase !== newState.networkPassphrase ||
        prev.userProfile !== newState.userProfile
      ) {
        return newState;
      }
      return prev;
    });
  };

  // Separate function to update only wallet connection state (not profile)
  const updateWalletState = (walletState: {
    address?: string;
    network?: string;
    networkPassphrase?: string;
  }) => {
    setState((prev: Omit<WalletContextType, "isPending">) => {
      // Only update wallet fields, preserve userProfile
      if (
        prev.address !== walletState.address ||
        prev.network !== walletState.network ||
        prev.networkPassphrase !== walletState.networkPassphrase
      ) {
        return {
          ...prev,
          ...walletState
        };
      }
      return prev;
    });
  };

  const updateCurrentWalletState = async () => {
    // There is no way, with StellarWalletsKit, to check if the wallet is
    // installed/connected/authorized. We need to manage that on our side by
    // checking our storage item.
    const walletId = storage.getItem("walletId");
    const walletNetwork = storage.getItem("walletNetwork");
    const walletAddr = storage.getItem("walletAddress");
    const passphrase = storage.getItem("networkPassphrase");

    if (
      !state.address &&
      walletAddr !== null &&
      walletNetwork !== null &&
      passphrase !== null
    ) {
      updateWalletState({
        address: walletAddr,
        network: walletNetwork,
        networkPassphrase: passphrase,
      });
    }

    if (!walletId) {
      nullify();
    } else {
      if (popupLock.current) return;
      // If our storage item is there, then we try to get the user's address &
      // network from their wallet. Note: `getAddress` MAY open their wallet
      // extension, depending on which wallet they select!
      try {
        popupLock.current = true;
        wallet.setWallet(walletId);
        if (walletId !== "freighter" && walletAddr !== null) return;
        const [a, n] = await Promise.all([
          wallet.getAddress(),
          wallet.getNetwork(),
        ]);

        if (!a.address) storage.setItem("walletId", "");
        if (
          a.address !== state.address ||
          n.network !== state.network ||
          n.networkPassphrase !== state.networkPassphrase
        ) {
          storage.setItem("walletAddress", a.address);
          // Use updateWalletState instead of updateState to preserve userProfile
          updateWalletState({ ...a, ...n });
        }
      } catch (e) {
        // If `getNetwork` or `getAddress` throw errors... sign the user out???
        nullify();
        // then log the error (instead of throwing) so we have visibility
        // into the error while working on Scaffold Stellar but we do not
        // crash the app process
        console.error(e);
      } finally {
        popupLock.current = false;
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let isMounted = true;

    // Create recursive polling function to check wallet state continuously
    const pollWalletState = async () => {
      if (!isMounted) return;

      await updateCurrentWalletState();

      if (isMounted) {
        timer = setTimeout(() => void pollWalletState(), POLL_INTERVAL);
      }
    };

    // Get the wallet address when the component is mounted for the first time
    startTransition(async () => {
      await updateCurrentWalletState();
      // Start polling after initial state is loaded

      if (isMounted) {
        timer = setTimeout(() => void pollWalletState(), POLL_INTERVAL);
      }
    });

    // Clear the timeout and stop polling when the component unmounts
    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- it SHOULD only run once per component mount

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (!state.address) return;
    
    try {
      setState(prev => ({ ...prev, isProfileLoading: true }));
      const profile = await taskMasterService.getUserProfile(state.address);
      setState(prev => ({ ...prev, userProfile: profile, isProfileLoading: false }));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setState(prev => ({ ...prev, userProfile: null, isProfileLoading: false }));
    }
  };

  // Check for user profile when address changes
  useEffect(() => {
    if (state.address) {
      void refreshUserProfile();
    }
  }, [state.address]); // Remove refreshUserProfile from dependencies

  const contextValue = useMemo(
    () => ({
      ...state,
      isPending,
      signTransaction,
      userProfile: state.userProfile || null,
      isProfileLoading: state.isProfileLoading || false,
      refreshUserProfile,
    }),
    [state, isPending, signTransaction, refreshUserProfile],
  );

  return <WalletContext value={contextValue}>{children}</WalletContext>;
};
