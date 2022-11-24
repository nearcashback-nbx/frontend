import { AuthStore } from "./AuthStore";
import { ReceiptStore } from "./ReceiptStore";

export class RootStore {
  public readonly authStore: AuthStore;
  public readonly receiptStore: ReceiptStore;

  constructor() {
    this.authStore = new AuthStore();
    this.receiptStore = new ReceiptStore();

    // init only on client side
    if (
      process.env.NODE_ENV !== "production" &&
      typeof window !== "undefined"
    ) {
      // for debugging
      // @ts-ignore
      window.store = this;
    }
  }

  public get isReady(): boolean {
    return this.authStore.isReady;
  }
}
