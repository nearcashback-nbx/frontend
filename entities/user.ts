import { JsonUser } from "types/json_user";
import * as naj from "near-api-js";

export class UserEntity {
  public readonly id: string;
  public readonly email: string;
  public readonly name: string;
  public readonly avatar: string;
  public readonly pendingBalance: string;
  public readonly availableBalance: string;

  constructor(json: JsonUser) {
    this.id = json.id;
    this.email = json.email;
    this.name = json.name;
    this.avatar = json.avatar_url;
    this.pendingBalance = json.balance.pending;
    this.availableBalance = json.balance.available;
  }

  public get formattedPendingBalance(): string {
    const balance = naj.utils.format.formatNearAmount(this.pendingBalance, 4);

    // multiply by 1000 so it looks much informative
    return eval(`${balance} * 1000`);
  }

  public get formattedAvailableBalance(): string {
    const balance = naj.utils.format.formatNearAmount(this.availableBalance, 4);

    // multiply by 1000 so it looks much informative
    return eval(`${balance} * 1000`);
  }
}
