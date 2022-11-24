import { makeAutoObservable } from "mobx";
import { RefObject } from "react";

const getDataUrlCaptureFromVideoElement = (
  video: HTMLVideoElement
): string | null => {
  const canvas = document.createElement("canvas");

  canvas.width = 1920;
  canvas.height = 1080;

  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg");
};

/***
 * Converts a dataUrl base64 image string into a File byte array
 * dataUrl example:
 * data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIsAAACLCAYAAABRGWr/AAAAAXNSR0IA...etc
 */
const dataUrlToFile = (dataUrl: string, filename: string): File | null => {
  const arr = dataUrl.split(",");
  if (arr.length < 2) {
    return null;
  }
  const mimeArr = arr[0].match(/:(.*?);/);
  if (!mimeArr || mimeArr.length < 2) {
    return null;
  }
  const mime = mimeArr[1];
  const buff = Buffer.from(arr[1], "base64");
  return new File([buff], filename, { type: mime });
};

type ReceiptEntity = {
  id: string;
};

export class ReceiptStore {
  public videoRef: RefObject<HTMLVideoElement> | null;

  constructor() {
    this.videoRef = null;

    makeAutoObservable(
      this,
      {
        videoRef: false,
      },
      { autoBind: true }
    );
  }

  public processReceipt = async (data: string): Promise<ReceiptEntity> => {
    const token = window.localStorage.getItem("access_token");

    if (token === null) throw new Error(`No token for fetching`);

    const url = new URL("/receipt", process.env.NEXT_PUBLIC_API_DOMAIN);

    const receipt = await fetch(url, {
      method: "POST",
      headers: {
        ["Content-Type"]: "application/json",
        ["Authorization"]: "Bearer " + token,
      },
      body: JSON.stringify({
        data: data,
      }),
    }).then((res) => res.json());

    return receipt;
  };

  public saveAndUploadReceiptCapture = async (
    receipt: ReceiptEntity
  ): Promise<void> => {
    if (this.videoRef === null || this.videoRef.current === null) return;

    const data = getDataUrlCaptureFromVideoElement(this.videoRef.current);

    if (data === null) return;

    const file = dataUrlToFile(data, "capture.jpeg");

    if (file === null) return;

    const token = window.localStorage.getItem("access_token");

    if (token === null) throw new Error(`No token for fetching`);

    const url = new URL("/receipt/capture", process.env.NEXT_PUBLIC_API_DOMAIN);

    const formData = new FormData();

    formData.set("receipt_id", receipt.id);
    formData.set("file", file);

    // use form data

    await fetch(url, {
      method: "POST",
      headers: {
        ["Authorization"]: "Bearer " + token,
      },
      body: formData,
    }).then((res) => res.json());
  };

  public setRef = (ref: ReceiptStore["videoRef"]): void => {
    this.videoRef = ref;
  };

  public resetRef = (): void => {
    this.videoRef = null;
  };
}
