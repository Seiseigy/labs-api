import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Game, GameStates } from "./planning-poker/types";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const planningPokerState: Game = {
  id: "planning-poker",
  name: "Planning Poker",
  state: "lobby",
  players: [],
  votes: {},
};

io.on("connect", (socket) => {
  // when a player connects, send the current state
  console.log("🃏  Player connected:", socket.id);
  socket.emit("state", planningPokerState);
  // when a player joins, add them to the game
  socket.on("join", (name: string) => {
    planningPokerState.players.push({ id: socket.id, name, vote: null });
    console.log("🃏  Player joined:", name, " with id ", socket.id);
    io.emit("state", planningPokerState);
  });
  socket.on("vote", (card: string) => {
    const p = planningPokerState.players.find((p) => p.id === socket.id);
    if (p) p.vote = card;
    io.emit("state", planningPokerState);
  });
  socket.on("reveal", () => {
    planningPokerState.state = GameStates.REVEALING;
    io.emit("state", planningPokerState);
  });
  socket.on("reset", () => {
    planningPokerState.players.forEach((p) => (p.vote = null));
    planningPokerState.state = GameStates.VOTING;
    io.emit("state", planningPokerState);
  });
  socket.on("disconnect", () => {
    planningPokerState.players = planningPokerState.players.filter(
      (p) => p.id !== socket.id
    );
    io.emit("state", planningPokerState);
  });
});

httpServer.listen(process.env.PORT || 3000, () =>
  console.log("🃏  Planning-Poker server on 3000")
);
