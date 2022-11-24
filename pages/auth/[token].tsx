import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { Container } from "@mui/material";
import { useRootStore } from "providers/RootStoreContext";
import Loading from "components/Loading";
import { observer } from "mobx-react-lite";

const AuthenticationPage = (): JSX.Element => {
  const router = useRouter();
  const { authStore } = useRootStore();

  useEffect(() => {
    if (!router) return;

    const queryKeysCount = Object.keys(router.query).length;

    if (queryKeysCount === 0) return;

    const { token } = router.query;

    if (!token) return;

    authStore.authenticate(token as string);

    router.replace("/");
  }, [router.query]);

  return (
    <Container
      disableGutters={true}
      maxWidth="sm"
      sx={{
        height: "85vh",
        display: "flex",
      }}
    >
      <Loading title="Authorizing" />
    </Container>
  );
};

const WrappedAuthenticationPage = observer(AuthenticationPage);

export default WrappedAuthenticationPage;
