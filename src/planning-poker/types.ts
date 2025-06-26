export type Player = {
  id: string;
  name: string;
  vote: string | null;
};

export const GameStates = {
  LOBBY: "lobby",
  VOTING: "voting",
  REVEALING: "revealing",
  FINISHED: "finished",
} as const;

export type GameState = (typeof GameStates)[keyof typeof GameStates];

export type Game = {
  id: string;
  name: string;
  state: GameState;
  players: Player[];
  votes: Record<string, string>; // Maps player ID to their vote
};
