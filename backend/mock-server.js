const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require("cors");

app.use(cors());

io.on("connection", (socket) => {
  console.log("backendojo connected");

  socket.on("disconnect", () => {
    console.log("backendojo disconnected");
  });
});

server.listen(8080, () => {
  console.log("listening on *:8080");
});
