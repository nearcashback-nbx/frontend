import { Box, CardMedia, IconButton } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Loading from "components/Loading";
import QrScanner from "qr-scanner";
import { RefObject, useEffect, useRef } from "react";
import { useRootStore } from "providers/RootStoreContext";

type Optional<T> = T | null;
type QrScannerComponentProps = {
  onScanResult: (result: string) => void;
  onScanError: (error: Error | string) => void;
  onScanStop: (reason: string) => void;
  onScanStart: () => void;
};

let _scanner: Optional<QrScanner> = null;

const getScanner = (): QrScanner => {
  if (_scanner === null)
    throw new Error(
      `Scanner instance doesn't exist, create it with 'buildScanner'`
    );

  return _scanner;
};

const destroyScanner = (): void => {
  console.log("destroy scanner");
  if (_scanner === null) return;

  _scanner.stop();
  _scanner.destroy();
  _scanner = null;
};

const buildScanner = (
  video: HTMLVideoElement,
  onDecode: (result: string) => void,
  onDecodeError: (error: Error | string) => void
): void => {
  console.log("build scanner");
  if (_scanner !== null)
    throw new Error(
      `Scanner instance already exist, try to destroy it if you want to create a new one`
    );

  _scanner = new QrScanner(video, (result) => onDecode(result.data), {
    onDecodeError: onDecodeError,
    maxScansPerSecond: 60,
    highlightScanRegion: true,
    highlightCodeOutline: true,
    calculateScanRegion: (video) => {
      const minDim = Math.min(video.videoHeight, video.videoWidth);

      const regionWidth = Math.floor(minDim / 4);
      const regionHeight = Math.floor(minDim / 4);

      // console.log("w", video.videoWidth);
      // console.log("h", video.videoHeight);

      const regionX = Math.floor((video.videoWidth - regionWidth) / 2);
      const regionY = Math.floor((video.videoHeight - regionHeight) / 2);

      const region = {
        width: regionWidth,
        height: regionHeight,
        x: regionX,
        y: regionY,
        downScaledHeight: 400,
        downScaledWidth: 400,
      };

      console.log("region", region);

      return region;
    },
  });
};

const QrScannerComponent = (props: QrScannerComponentProps): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { receiptStore } = useRootStore();

  useEffect(() => {
    receiptStore.setRef(videoRef);
  }, []);

  useEffect(() => {
    // start scanning on component mounted
    startScan();

    // destroy on component unmounted
    return () => destroyScanner();
  }, []);

  const startScan = async (): Promise<void> => {
    console.log("start scan");

    if (!videoRef.current) {
      console.warn(`No video element`);
      return;
    }

    try {
      buildScanner(videoRef.current, props.onScanResult, props.onScanError);
    } catch {}

    const scanner = getScanner();

    console.log("scanner", scanner);

    try {
      await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
        },
      });
    } catch {
      console.error("No access got to devices");
      props.onScanStop("No camera permissions");
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();

    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );

    if (videoDevices.length === 0) {
      throw new Error(`No video devices found`);
    }

    scanner.setCamera(videoDevices[1].deviceId);

    await scanner.start();

    props.onScanStart();
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
      }}
    >
      <CardMedia component="video" ref={videoRef} />
    </Box>
  );
};

export default QrScannerComponent;
