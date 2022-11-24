import * as React from "react";

import { configure } from "mobx";
import { enableStaticRendering } from "mobx-react-lite";

import { RootStore } from "stores/RootStore";

configure({
  enforceActions: "always",
  // computedRequiresReaction: true,
  // reactionRequiresObservable: true,
  // observableRequiresReaction: true,
  disableErrorBoundaries: false,
});

// in the browser
enableStaticRendering(typeof window === "undefined");

let store: RootStore;

const StoreContext = React.createContext<RootStore | undefined>(undefined);
StoreContext.displayName = "StoreContext";

const useRootStore = (): RootStore => {
  const context = React.useContext(StoreContext);
  if (!context) {
    throw new Error("useRootStore must be used within RootStoreProvider!");
  }

  return context;
};

function initializeStore(): RootStore {
  const _store = store ?? new RootStore();

  // For SSG and SSR always create a new store
  if (typeof window === "undefined") return _store;
  // Create the store once in the client
  if (!store) store = _store;

  return _store;
}

interface RootStoreProviderProps {
  children: React.ReactNode;
}

const RootStoreProvider = ({
  children,
}: RootStoreProviderProps): JSX.Element => {
  const rootStore = initializeStore();

  return (
    <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
  );
};

export { useRootStore, RootStoreProvider };
