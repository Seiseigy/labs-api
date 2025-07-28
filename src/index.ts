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
};

const handleVote = (socketId: string, card: string) => {
  const player = planningPokerState.players.find((p) => p.id === socketId);
  if (player) {
    player.vote = card;
  }
};

io.on("connect", (socket) => {
  const refreshState = () => {
    io.sockets.sockets.forEach((socket) => {
      const socketId = socket.id;
      /**
       * When revealing, we want to show all votes.
       * When voting, we want to show the votes of all players except the one who is voting.
       * If the player has not voted yet, we want to show null.
       * If the player has voted, we want to show -1.
       * This is to prevent players from seeing each other's votes before revealing.
       */
      const players = planningPokerState.players.map((p) => ({
        ...p,
        vote:
          planningPokerState.state === GameStates.REVEALING
            ? p.vote
            : p.id === socketId
            ? p.vote
            : p.vote
            ? -1
            : null,
      }));

      socket.emit("state", {
        ...planningPokerState,
        players,
      });
    });
  };
  // when a player connects, send the current state
  socket.emit("state", planningPokerState);
  // when a player joins, add them to the game
  socket.on("join", (name: string) => {
    planningPokerState.players.push({ id: socket.id, name, vote: null });
    refreshState();
  });
  socket.on("vote", (card: string) => {
    handleVote(socket.id, card);
    refreshState();
  });
  socket.on("reveal", () => {
    planningPokerState.state = GameStates.REVEALING;
    refreshState();
  });
  socket.on("reset", () => {
    planningPokerState.players.forEach((p) => (p.vote = null));
    planningPokerState.state = GameStates.VOTING;
    refreshState();
  });
  socket.on("disconnect", () => {
    planningPokerState.players = planningPokerState.players.filter(
      (p) => p.id !== socket.id
    );
    refreshState();
  });
});

httpServer.listen(process.env.PORT || 3000, () =>
  console.log("🃏  Planning-Poker server on 3000")
);
