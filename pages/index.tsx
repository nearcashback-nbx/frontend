import Head from "next/head";
import {
  Container,
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  Avatar,
  Tooltip,
} from "@mui/material";
import QrScannerComponent from "../components/QrScanner";
import { useRootStore } from "providers/RootStoreContext";
import Loading from "components/Loading";
import { observer } from "mobx-react-lite";
import withAuth from "hocs/withAuth";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useState } from "react";
import { useSnackbar } from "notistack";
import { v4 as uuidv4 } from "uuid";
import EventEmitter from "events";
import { GetStaticPropsResult } from "next";

type QrData = {
  amount: string;
};

const substringBetweenCharacters = (
  source: string,
  left: string,
  right: string
): string | null => {
  const leftIndex = source.lastIndexOf(left);
  const rightIndex = source.lastIndexOf(right);

  if (leftIndex >= rightIndex) return null;

  const res = source.substring(leftIndex + 1, rightIndex);

  if (!res) return null;

  return res;
};

const parseDataFromResult = (result: string): QrData => {
  const parts = result.split(";");

  if (parts.length !== 12)
    throw new Error(`Expected result has another structure`);

  /** @todo detect signature & public key and then validate data */

  const taxString = parts[3];

  const amount = substringBetweenCharacters(taxString, "^", ":");

  if (amount === null) throw new Error(`No amount found`);

  return { amount };
};

type QueueIdentifier = string;

const queue = {
  _bus: new EventEmitter(),
  _store: [] as QueueIdentifier[],
  _blocked: false,
  register(): QueueIdentifier {
    if (this.blocked)
      throw new Error(`Couldn't register in queue, it's blocked`);

    const id = uuidv4();

    this._store.push(id);

    console.log("[queue]register:" + id);

    return id;
  },
  get active(): QueueIdentifier | null {
    return this._store[0] || null;
  },
  get blocked(): boolean {
    return this._blocked;
  },
  done(id: QueueIdentifier): void {
    if (this.active !== id)
      throw new Error(`Couldn't done id which isn't active`);

    this._store.shift();

    console.log("[queue]done:" + id);

    const newTurn = this.active;

    if (!newTurn) return;

    this._bus.emit(`turn_${newTurn}`);
  },
  stopAndFlush(): void {
    console.log("[queue]stop");

    // stop all elements in queue
    this._store.forEach((stopId) => {
      this._bus.emit(`stop_${stopId}`);
    });

    this._store.length = 0;
  },
  async waitTurnInQueue(id: QueueIdentifier): Promise<void> {
    return new Promise((resolve, reject) => {
      const onTurn = () => {
        console.log("[queue]onTurn:" + id);
        resolve();
      };
      const onStop = () => {
        console.log("[queue]onStop:" + id);
        reject(new Error("Queue has been stopped"));
      };

      if (this.active === id) return onTurn();

      console.log("[queue]awaiting:" + id);
      this._bus.once(`turn_${id}`, onTurn);
      this._bus.once(`stop_${id}`, onStop);
    });
  },
  block(): void {
    this._blocked = true;
  },
  unblock(): void {
    this._blocked = false;
  },
};

const HomePage = (): JSX.Element => {
  const [scanningActive, setScanningActive] = useState(false);
  const [scanningLoading, setScanningLoading] = useState(false);
  const { authStore, isReady, receiptStore } = useRootStore();

  const { enqueueSnackbar } = useSnackbar();

  const onScanResult = async (result: string): Promise<void> => {
    console.log(`result`, result);

    try {
      // fails if result isn't valid
      parseDataFromResult(result);
    } catch {
      console.log(`Found result isn't valid`);

      // continue scanning
      return;
    }

    try {
      const queueId = queue.register();

      await queue.waitTurnInQueue(queueId);
    } catch (err: any) {
      console.log(
        `[queue]No more need to execute 'onScanResult' further - ${err.message}`
      );

      // no longer needed to continue execution
      return;
    }

    try {
      const receipt = await receiptStore.processReceipt(result);

      console.log("receipt", receipt);

      receiptStore.saveAndUploadReceiptCapture(receipt);

      enqueueSnackbar(`QR was successfully processed`, {
        variant: "success",
      });

      await authStore.fetchUserData();
    } catch {
      console.log(`Found result probably was already scanned`);

      enqueueSnackbar(`Probably QR was already scanned`, {
        variant: "error",
      });
    } finally {
      stopScanning();

      queue.block();
      queue.stopAndFlush();
      receiptStore.resetRef();
    }
  };

  const onScanError = (error: Error | string): void => {
    console.log(`[QrScanner] Hasn't decoded due to - '${error}'`);
  };

  const onScanStop = (reason: string): void => {
    console.log(`[QrScanner] Stopped due to - '${reason}'`);
    stopScanning();
  };

  const onScanStart = (): void => {
    console.log(`[QrScanner] Started`);

    queue.unblock();
    setScanningLoading(false);
  };

  const startScanning = async (): Promise<void> => {
    setScanningActive(true);
    setScanningLoading(true);
  };

  const stopScanning = (): void => {
    setScanningActive(false);
    setScanningLoading(false);
  };

  const loginWithGoogle = (): void => {
    const url = new URL("/auth/google", process.env.NEXT_PUBLIC_API_DOMAIN);

    window.open(url, "_self");
  };

  const logout = (): void => {
    authStore.logout();

    window.location.reload();
  };

  return (
    <>
      <Head>
        <title>Near Cashback</title>
      </Head>
      <Container
        disableGutters={true}
        maxWidth="sm"
        sx={{
          padding: 0,
          height: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            marginY: 2,
          }}
        >
          <Typography align="center" variant="h3">
            Retention Chain
          </Typography>

          <Typography align="center" variant="body1">
            Get paid with web3 because future is NEAR
          </Typography>
        </Box>
        <Divider />
        {!isReady && (
          <Box
            sx={{
              display: "flex",
              flexGrow: 1,
              marginX: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Loading title="Loading" />
          </Box>
        )}
        {isReady && !authStore.isLoggedIn && (
          <Box
            sx={{
              display: "flex",
              flexGrow: 1,
              marginX: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button variant="contained" onClick={loginWithGoogle}>
              Sign in with Google
            </Button>
          </Box>
        )}
        {isReady && authStore.isLoggedIn && !scanningActive && (
          <>
            <Box
              sx={{
                margin: 4,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Chip
                avatar={<Avatar alt="avatar" src={authStore.user?.avatar} />}
                label={authStore.user?.name}
                variant="outlined"
              />
              <Tooltip title="Pending balance">
                <Chip
                  icon={<CurrencyExchangeIcon />}
                  label={authStore.user?.formattedPendingBalance}
                  variant="outlined"
                />
              </Tooltip>
              <Tooltip title="Available balance">
                <Chip
                  icon={<AttachMoneyIcon />}
                  label={authStore.user?.formattedAvailableBalance}
                  variant="outlined"
                />
              </Tooltip>

              <Box sx={{ paddingLeft: 2 }}>
                <Button variant="outlined" onClick={logout}>
                  Logout
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexGrow: 1,
              }}
            >
              <Button variant="contained" onClick={startScanning}>
                Scan
              </Button>
            </Box>
          </>
        )}
        {isReady && authStore.isLoggedIn && scanningActive && (
          <>
            <Box
              sx={{
                justifyContent: "center",
                display: "flex",
                marginY: 1,
              }}
            >
              <Button
                variant="contained"
                fullWidth={false}
                onClick={stopScanning}
              >
                Stop
              </Button>
            </Box>
            <Box sx={{ justifyContent: "center", display: "flex" }}>
              <QrScannerComponent
                onScanError={onScanError}
                onScanResult={onScanResult}
                onScanStop={onScanStop}
                onScanStart={onScanStart}
              />
            </Box>
            {scanningLoading && <Loading title="Preparing scanner" />}
          </>
        )}
      </Container>
    </>
  );
};

export function getStaticProps(): GetStaticPropsResult<{}> {
  return {
    props: {},
    revalidate: 600,
  };
}

const WrappedHomePage = withAuth(observer(HomePage));

export default WrappedHomePage;
