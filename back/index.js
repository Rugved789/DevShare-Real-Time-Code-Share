import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import axios from "axios";
import { stdin } from "process";
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      // Leave the current room if already in one
      socket.leave(currentRoom);
      if (rooms.has(currentRoom)) {
        rooms.get(currentRoom).users.delete(currentUser);
        if (rooms.get(currentRoom).size === 0) {
          rooms.delete(currentRoom); // Clean up empty rooms
        } else {
          io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users)
        );
        }
      }
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId,{users:new Set(),code:"// Start Code Here"});
    }
    rooms.get(roomId).users.add(userName);
    socket.emit("codeUpdate",rooms.get(roomId).code);

    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom).users));
  });

  socket.on("codeChange", ({ roomId, code }) => {
    if(rooms.has(roomId)){
      rooms.get(roomId).code  =code;
    }
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      if (rooms.has(currentRoom)) {
        rooms.get(currentRoom).users.delete(currentUser);
        if (rooms.get(currentRoom).size === 0) {
          rooms.delete(currentRoom); // Clean up empty rooms
        } else {
          io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users));
        }
      }

      socket.leave(currentRoom);

      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });
  socket.on("compileCode", async ({ code, roomId, language, version,input}) => {
    try {
      if (rooms.has(roomId)) {
        const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
          language,
          version,
          files: [{ content: code }],
          stdin:input,
        });
        io.to(roomId).emit("codeResponse", response.data);
      } else {
        console.error(`Room ${roomId} does not exist.`);
      }
    } catch (error) {
      console.error("Error compiling code:", error.message);
      io.to(roomId).emit("codeResponse", { error: "Failed to compile code. Please try again." });
    }
  });
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      if (rooms.has(currentRoom)) {
        rooms.get(currentRoom).users.delete(currentUser);
        if (rooms.get(currentRoom).size === 0) {
          rooms.delete(currentRoom); // Clean up empty rooms
        } else {
          io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users));
        }
      }
    }
    console.log("User Disconnected", socket.id);
  });
});

const port = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "/front/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "front", "dist", "index.html"));
});

server.listen(port, () => {
  console.log("Server is working on port 5000");
});