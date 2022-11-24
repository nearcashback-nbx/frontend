import { useRootStore } from "providers/RootStoreContext";
import React, { useCallback } from "react";

const withAuth = (Component: any) => {
  const AuthHOC = (props: any) => {
    const { authStore } = useRootStore();

    const effect = useCallback(async (): Promise<void> => {
      // make try to fetch user
      await authStore
        .fetchUserData()
        .finally(authStore.afterFirstAuthenticationTry);
    }, []);

    React.useLayoutEffect(() => {
      effect();
    }, []);

    return <Component {...props} />;
  };

  return AuthHOC;
};

export default withAuth;
