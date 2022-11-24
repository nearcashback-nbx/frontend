import { UserEntity } from "entities/user";
import { makeAutoObservable } from "mobx";

export class AuthStore {
  private _user: UserEntity | null;
  private _firstTimeReady: boolean;

  constructor() {
    this._user = null;
    this._firstTimeReady = false;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get isReady(): boolean {
    return this._firstTimeReady || this.isLoggedIn;
  }

  public get user(): UserEntity | null {
    return this._user;
  }

  public get isLoggedIn(): boolean {
    return this.user !== null;
  }

  public afterFirstAuthenticationTry = (): void => {
    this._firstTimeReady = true;
  };

  public fetchUserData = async (): Promise<void> => {
    /** @todo if 401, then make logout */

    const token = window.localStorage.getItem("access_token");

    if (token === null) return;

    const url = new URL("/user/me", process.env.NEXT_PUBLIC_API_DOMAIN);

    const jsonUser = await fetch(url, {
      method: "GET",
      headers: {
        ["Content-Type"]: "application/json",
        ["Authorization"]: "Bearer " + token,
      },
    }).then((res) => res.json());

    const user = new UserEntity(jsonUser);

    this._user = user;
  };

  public authenticate = (token: string): void => {
    localStorage.setItem("access_token", token);
  };

  public logout = (): void => {
    // clean local storage
    localStorage.removeItem("access_token");

    // remove user object
    this._user = null;
  };
}
