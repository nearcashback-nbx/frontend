export type JsonUser = {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  balance: {
    pending: string;
    available: string;
    total: string;
  };
};
