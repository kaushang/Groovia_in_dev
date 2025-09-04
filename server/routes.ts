import type { Express } from "express";
import {
  createServer,
  IncomingMessage,
  ServerResponse,
  type Server,
} from "http";
import { storage } from "./storage";
import { User, Room, Song, QueueItem, Vote } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { log } from "./vite";

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
import { Server as SocketIOServer } from "socket.io";

export async function registerRoutes(
app: Express, server: Server<typeof IncomingMessage, typeof ServerResponse>, io: SocketIOServer): Promise<Server> {

  // Room routes
  app.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  // ✅
  app.post("/api/rooms/code/:code", async (req, res) => {
    try {
      const room = await Room.findOne({ code: req.params.code }); // search by code field
      const { username } = req.body;

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (!username) {
        return res.status(400).json({
          message: "Username is required",
        });
      }

      const user = new User({
        username: username,
        createdAt: new Date(),
      });

      const savedUser = await user.save();

      await Room.updateOne(
        { code: req.params.code }, // filter by code
        {
          $push: {
            members: {
              userId: savedUser._id,
              joinedAt: new Date(),
            },
          },
        }
      );

      const updatedRoom = await Room.findOne({ code: req.params.code }); // Fetch the updated room
      res.json(updatedRoom);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  // ✅
app.post("/api/rooms", async (req, res) => {
  try {
    const { name, username } = req.body;

    if (!name || !username) {
      return res.status(400).json({
        message: "Name and username are required",
      });
    }

    // Create the user
    const user = new User({
      username: username,
      createdAt: new Date(),
    });

    const savedUser = await user.save();

    const roomMembers = [
      {
        userId: savedUser._id,
        joinedAt: new Date(),
      },
    ];

    // Create the room
    const room = new Room({
      name: name,
      code: generateRoomCode(),
      createdBy: savedUser._id,
      isActive: true,
      listenerCount: 0, // Start at 0 - WebSocket will handle active listeners
      members: roomMembers,
      createdAt: new Date(),
    });

    const savedRoom = await room.save();

    // Populate the room data
    await savedRoom.populate([
      { path: "createdBy", select: "username email" },
      { path: "members.userId", select: "username email" },
    ]);

    // Send response first
    res.status(201).json({
      success: true,
      room: savedRoom,
      userId: savedUser._id, // Return just the ID, not the whole user object
    });

    // WebSocket notifications (after response is sent)
    // Note: Only emit to relevant users, not globally
    
    // Optionally notify about room creation (if you have a global rooms list)
    io.emit("roomCreated", {
      room: {
        id: savedRoom._id,
        name: savedRoom.name,
        code: savedRoom.code,
        createdBy: savedRoom.createdBy,
        memberCount: savedRoom.members.length,
        createdAt: savedRoom.createdAt,
      },
    });

    // The creator will join via WebSocket when they navigate to the room
    // No need to emit roomInvitation to the creator here since they're immediately joining

    console.log(`Room created: ${savedRoom.name} (${savedRoom.code}) by ${savedUser.username}`);

  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create room",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
  app.post("/api/rooms/:roomId/join", async (req, res) => {
    try {
      const { userId } = req.body;
      const roomId = req.params.roomId;

      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      const member = await storage.addRoomMember({ roomId, userId });
      res.json(member);
    } catch (error) {
      res.status(400).json({ message: "Failed to join room" });
    }
  });

app.post("/api/rooms/:roomId/leave", async (req, res) => {
  try {

    const { userId } = req.body;
    const { roomId } = req.params;
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is actually in the room
    const userInRoom = room.members.find(member => member.userId.toString() === userId.toString());
    if (!userInRoom) {
      return res.status(400).json({ message: "User is not a member of this room" });
    }

    // Remove user from room members
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $pull: { members: { userId: userId } } },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: "Failed to update room" });
    }

    // If room is empty, delete it
    if (updatedRoom.members.length === 0) {
      await Room.findByIdAndDelete(roomId);
      
      // Notify via WebSocket that room was deleted
      io.to(roomId).emit("roomDeleted", { roomId });
    } else {
      // Notify remaining members about updated room
      const currentListenerCount = room.get(roomId)?.size || 0;
      
      io.to(roomId).emit("roomUpdated", {
        ...updatedRoom.toObject(),
        listenerCount: currentListenerCount
      });
    }

    // Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      console.warn(`⚠️ User ${userId} not found in database during leave operation`);
    } else {
      console.log(`✅ User deleted:`, deletedUser.username);
    }

    res.status(200).json({
      success: true,
      message: "Successfully left room"
    });

  } catch (error) {
    console.error("💥 Error leaving room:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'Unknown error');
    res.status(500).json({ 
      success: false,
      message: "Failed to leave room",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
  // Song routes
  app.get("/api/songs/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query required" });
      }

      const songs = await storage.searchSongs(q);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Queue routes
  app.get("/api/rooms/:roomId/queue", async (req, res) => {
    try {
      const queue = await storage.getQueueForRoom(req.params.roomId);
      res.json(queue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch queue" });
    }
  });

  app.post("/api/rooms/:roomId/queue", async (req, res) => {
    try {
      const roomId = req.params.roomId;
      const { songId, addedBy } = req.body;
      console.log("OK report");
      // Get current queue to determine position
      const currentQueue = await storage.getQueueForRoom(roomId);
      const position = currentQueue.length;

      const queueItem = await storage.addToQueue({
        roomId,
        songId,
        addedBy,
        position,
      });

      res.json(queueItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to add song to queue" });
    }
  });

  app.delete("/api/queue/:queueItemId", async (req, res) => {
    try {
      const success = await storage.removeFromQueue(req.params.queueItemId);
      if (!success) {
        return res.status(404).json({ message: "Queue item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from queue" });
    }
  });

  // Vote routes
  app.post("/api/queue/:queueItemId/vote", async (req, res) => {
    try {
      const { userId, voteType } = req.body;
      const queueItemId = req.params.queueItemId;

      // Remove existing vote if any
      await storage.removeVote(queueItemId, userId);

      // Add new vote
      const vote = await storage.addVote({
        queueItemId,
        userId,
        voteType,
      });

      res.json(vote);
    } catch (error) {
      res.status(400).json({ message: "Failed to vote" });
    }
  });

  app.delete("/api/queue/:queueItemId/vote", async (req, res) => {
    try {
      const { userId } = req.body;
      const queueItemId = req.params.queueItemId;

      const success = await storage.removeVote(queueItemId, userId);
      if (!success) {
        return res.status(404).json({ message: "Vote not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to remove vote" });
    }
  });

  // User routes
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
