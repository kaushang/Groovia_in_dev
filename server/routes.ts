import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertRoomSchema, insertQueueItemSchema, insertVoteSchema, insertRoomMemberSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email) || await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName } });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, username, password } = req.body;
      
      let user;
      if (email) {
        user = await storage.getUserByEmail(email);
      } else if (username) {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you'd verify the password hash
      res.json({ user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName } });
    } catch (error) {
      res.status(400).json({ message: "Login failed" });
    }
  });

  // Room routes
  app.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const room = await storage.getRoomWithDetails(req.params.roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.get("/api/rooms/code/:code", async (req, res) => {
    try {
      const room = await storage.getRoomByCode(req.params.code);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      res.status(400).json({ message: "Invalid room data" });
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
      const roomId = req.params.roomId;
      
      const success = await storage.removeRoomMember(roomId, userId);
      if (!success) {
        return res.status(404).json({ message: "Member not found in room" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to leave room" });
    }
  });

  // Song routes
  app.get("/api/songs/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
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
      
      // Get current queue to determine position
      const currentQueue = await storage.getQueueForRoom(roomId);
      const position = currentQueue.length;
      
      const queueItem = await storage.addToQueue({
        roomId,
        songId,
        addedBy,
        position
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
        voteType
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
