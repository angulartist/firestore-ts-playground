export interface IWinner {
  userName?: string;
  points?: number;
}

export interface IEnigma {
  id?: string;
  question?: string;
  isOpen?: string;
  winners?: IWinner[];
}
