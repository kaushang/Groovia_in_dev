import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatar: text("avatar"),
  songsPlayed: integer("songs_played").default(0),
  hoursListened: integer("hours_listened").default(0),
  roomsJoined: integer("rooms_joined").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  createdBy: varchar("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  listenerCount: integer("listener_count").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const songs = pgTable("songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  duration: integer("duration"), // in seconds
  thumbnail: text("thumbnail"),
  externalId: text("external_id"), // YouTube video ID or similar
  source: text("source").default("youtube") // youtube, spotify, etc
});

export const queueItems = pgTable("queue_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").references(() => rooms.id),
  songId: varchar("song_id").references(() => songs.id),
  addedBy: varchar("added_by").references(() => users.id),
  position: integer("position").notNull(),
  votes: integer("votes").default(0),
  isPlaying: boolean("is_playing").default(false),
  addedAt: timestamp("added_at").defaultNow()
});

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  queueItemId: varchar("queue_item_id").references(() => queueItems.id),
  userId: varchar("user_id").references(() => users.id),
  voteType: text("vote_type").notNull(), // 'up' or 'down'
  createdAt: timestamp("created_at").defaultNow()
});

export const roomMembers = pgTable("room_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").references(() => rooms.id),
  userId: varchar("user_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  code: true,
  listenerCount: true
});

export const insertSongSchema = createInsertSchema(songs).omit({
  id: true
});

export const insertQueueItemSchema = createInsertSchema(queueItems).omit({
  id: true,
  addedAt: true,
  votes: true,
  isPlaying: true
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true
});

export const insertRoomMemberSchema = createInsertSchema(roomMembers).omit({
  id: true,
  joinedAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;
export type QueueItem = typeof queueItems.$inferSelect;
export type InsertQueueItem = z.infer<typeof insertQueueItemSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type RoomMember = typeof roomMembers.$inferSelect;
export type InsertRoomMember = z.infer<typeof insertRoomMemberSchema>;

// Extended types for API responses
export type QueueItemWithSong = QueueItem & {
  song: Song;
  addedByUser: Pick<User, 'id' | 'username'>;
};

export type RoomWithDetails = Room & {
  currentSong?: Song;
  queueItems: QueueItemWithSong[];
  members: User[];
};
