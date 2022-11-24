import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { enableStaticRendering } from "mobx-react-lite";

import type { AppProps } from "next/app";
import { RootStoreProvider } from "providers/RootStoreContext";
import { SnackbarProvider } from "notistack";

if (typeof window === "undefined") {
  // @see https://github.com/mobxjs/mobx-react#server-side-rendering-with-enablestaticrendering
  enableStaticRendering(true);
}

export default function App({ Component, pageProps }: AppProps) {
  console.log(`Build date: ${Date.now()}`);

  const getProviders = (page: JSX.Element) => {
    return (
      <SnackbarProvider maxSnack={3} autoHideDuration={6000}>
        <RootStoreProvider>{page}</RootStoreProvider>
      </SnackbarProvider>
    );
  };

  return getProviders(<Component {...pageProps} />);
}
