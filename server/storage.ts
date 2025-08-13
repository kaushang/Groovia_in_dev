import { type User, type InsertUser, type Room, type InsertRoom, type Song, type InsertSong, type QueueItem, type InsertQueueItem, type Vote, type InsertVote, type RoomMember, type InsertRoomMember, type QueueItemWithSong, type RoomWithDetails } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Room operations
  getRoom(id: string): Promise<Room | undefined>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;
  getRoomsForUser(userId: string): Promise<Room[]>;
  getRoomWithDetails(roomId: string): Promise<RoomWithDetails | undefined>;

  // Song operations
  getSong(id: string): Promise<Song | undefined>;
  createSong(song: InsertSong): Promise<Song>;
  searchSongs(query: string): Promise<Song[]>;

  // Queue operations
  getQueueForRoom(roomId: string): Promise<QueueItemWithSong[]>;
  addToQueue(queueItem: InsertQueueItem): Promise<QueueItem>;
  removeFromQueue(queueItemId: string): Promise<boolean>;
  updateQueueItem(id: string, updates: Partial<QueueItem>): Promise<QueueItem | undefined>;
  reorderQueue(roomId: string, newOrder: string[]): Promise<boolean>;

  // Vote operations
  addVote(vote: InsertVote): Promise<Vote>;
  removeVote(queueItemId: string, userId: string): Promise<boolean>;
  getUserVote(queueItemId: string, userId: string): Promise<Vote | undefined>;

  // Room member operations
  addRoomMember(member: InsertRoomMember): Promise<RoomMember>;
  removeRoomMember(roomId: string, userId: string): Promise<boolean>;
  getRoomMembers(roomId: string): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rooms: Map<string, Room>;
  private songs: Map<string, Song>;
  private queueItems: Map<string, QueueItem>;
  private votes: Map<string, Vote>;
  private roomMembers: Map<string, RoomMember>;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.songs = new Map();
    this.queueItems = new Map();
    this.votes = new Map();
    this.roomMembers = new Map();
    
    // Seed with some initial data
    this.seedData();
  }

  private seedData() {
    // Create sample songs
    const sampleSongs = [
      { id: "song1", title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: 202, thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center", externalId: "4NRXx6U8ABQ", source: "youtube" },
      { id: "song2", title: "Good 4 U", artist: "Olivia Rodrigo", album: "SOUR", duration: 178, thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&crop=center", externalId: "gNi_6U5Pm_o", source: "youtube" },
      { id: "song3", title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", duration: 203, thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop&crop=center", externalId: "TUVcZfQe-Kw", source: "youtube" },
      { id: "song4", title: "Watermelon Sugar", artist: "Harry Styles", album: "Fine Line", duration: 174, thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center", externalId: "E07s5ZYygMg", source: "youtube" },
      { id: "song5", title: "Peaches", artist: "Justin Bieber", album: "Justice", duration: 198, thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&crop=center", externalId: "tQ0yjYUFKAE", source: "youtube" }
    ];

    sampleSongs.forEach(song => this.songs.set(song.id, song));
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      songsPlayed: 0,
      hoursListened: 0,
      roomsJoined: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Room operations
  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.code === code);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const code = this.generateRoomCode();
    const room: Room = {
      ...insertRoom,
      id,
      code,
      listenerCount: 0,
      isActive: true,
      createdAt: new Date()
    };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async getRoomsForUser(userId: string): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.createdBy === userId);
  }

  async getRoomWithDetails(roomId: string): Promise<RoomWithDetails | undefined> {
    const room = await this.getRoom(roomId);
    if (!room) return undefined;

    const queueItems = await this.getQueueForRoom(roomId);
    const members = await this.getRoomMembers(roomId);
    const currentSong = queueItems.find(item => item.isPlaying)?.song;

    return {
      ...room,
      currentSong,
      queueItems,
      members
    };
  }

  // Song operations
  async getSong(id: string): Promise<Song | undefined> {
    return this.songs.get(id);
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const id = randomUUID();
    const song: Song = { ...insertSong, id };
    this.songs.set(id, song);
    return song;
  }

  async searchSongs(query: string): Promise<Song[]> {
    const queryLower = query.toLowerCase();
    return Array.from(this.songs.values()).filter(song => 
      song.title.toLowerCase().includes(queryLower) ||
      song.artist.toLowerCase().includes(queryLower) ||
      song.album?.toLowerCase().includes(queryLower)
    );
  }

  // Queue operations
  async getQueueForRoom(roomId: string): Promise<QueueItemWithSong[]> {
    const items = Array.from(this.queueItems.values())
      .filter(item => item.roomId === roomId)
      .sort((a, b) => a.position - b.position);

    const result: QueueItemWithSong[] = [];
    
    for (const item of items) {
      const song = await this.getSong(item.songId!);
      const addedByUser = await this.getUser(item.addedBy!);
      
      if (song && addedByUser) {
        result.push({
          ...item,
          song,
          addedByUser: {
            id: addedByUser.id,
            username: addedByUser.username
          }
        });
      }
    }
    
    return result;
  }

  async addToQueue(insertQueueItem: InsertQueueItem): Promise<QueueItem> {
    const id = randomUUID();
    const queueItem: QueueItem = {
      ...insertQueueItem,
      id,
      votes: 0,
      isPlaying: false,
      addedAt: new Date()
    };
    this.queueItems.set(id, queueItem);
    return queueItem;
  }

  async removeFromQueue(queueItemId: string): Promise<boolean> {
    return this.queueItems.delete(queueItemId);
  }

  async updateQueueItem(id: string, updates: Partial<QueueItem>): Promise<QueueItem | undefined> {
    const item = this.queueItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.queueItems.set(id, updatedItem);
    return updatedItem;
  }

  async reorderQueue(roomId: string, newOrder: string[]): Promise<boolean> {
    const items = Array.from(this.queueItems.values()).filter(item => item.roomId === roomId);
    
    for (let i = 0; i < newOrder.length; i++) {
      const item = items.find(item => item.id === newOrder[i]);
      if (item) {
        item.position = i;
        this.queueItems.set(item.id, item);
      }
    }
    
    return true;
  }

  // Vote operations
  async addVote(insertVote: InsertVote): Promise<Vote> {
    const id = randomUUID();
    const vote: Vote = {
      ...insertVote,
      id,
      createdAt: new Date()
    };
    this.votes.set(id, vote);
    
    // Update vote count on queue item
    const queueItem = await this.queueItems.get(insertVote.queueItemId!);
    if (queueItem) {
      const voteChange = insertVote.voteType === 'up' ? 1 : -1;
      queueItem.votes = (queueItem.votes || 0) + voteChange;
      this.queueItems.set(queueItem.id, queueItem);
    }
    
    return vote;
  }

  async removeVote(queueItemId: string, userId: string): Promise<boolean> {
    const existingVote = Array.from(this.votes.values()).find(
      vote => vote.queueItemId === queueItemId && vote.userId === userId
    );
    
    if (existingVote) {
      this.votes.delete(existingVote.id);
      
      // Update vote count on queue item
      const queueItem = await this.queueItems.get(queueItemId);
      if (queueItem) {
        const voteChange = existingVote.voteType === 'up' ? -1 : 1;
        queueItem.votes = (queueItem.votes || 0) + voteChange;
        this.queueItems.set(queueItem.id, queueItem);
      }
      
      return true;
    }
    
    return false;
  }

  async getUserVote(queueItemId: string, userId: string): Promise<Vote | undefined> {
    return Array.from(this.votes.values()).find(
      vote => vote.queueItemId === queueItemId && vote.userId === userId
    );
  }

  // Room member operations
  async addRoomMember(insertMember: InsertRoomMember): Promise<RoomMember> {
    const id = randomUUID();
    const member: RoomMember = {
      ...insertMember,
      id,
      joinedAt: new Date()
    };
    this.roomMembers.set(id, member);
    
    // Update room listener count
    const room = await this.getRoom(insertMember.roomId!);
    if (room) {
      room.listenerCount = (room.listenerCount || 0) + 1;
      this.rooms.set(room.id, room);
    }
    
    return member;
  }

  async removeRoomMember(roomId: string, userId: string): Promise<boolean> {
    const member = Array.from(this.roomMembers.values()).find(
      m => m.roomId === roomId && m.userId === userId
    );
    
    if (member) {
      this.roomMembers.delete(member.id);
      
      // Update room listener count
      const room = await this.getRoom(roomId);
      if (room) {
        room.listenerCount = Math.max(0, (room.listenerCount || 0) - 1);
        this.rooms.set(room.id, room);
      }
      
      return true;
    }
    
    return false;
  }

  async getRoomMembers(roomId: string): Promise<User[]> {
    const memberIds = Array.from(this.roomMembers.values())
      .filter(member => member.roomId === roomId)
      .map(member => member.userId!);
    
    const users: User[] = [];
    for (const userId of memberIds) {
      const user = await this.getUser(userId);
      if (user) users.push(user);
    }
    
    return users;
  }
}

export const storage = new MemStorage();
