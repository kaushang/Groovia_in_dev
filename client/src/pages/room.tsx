import { useParams, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import {
  Music,
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Users,
  Share,
  QrCode,
  ExternalLink,
  LogOut,
  ChevronUp,
  ChevronDown,
  Plus,
  Shuffle,
  Trash2,
} from "lucide-react";
import GlassPanel from "@/components/glass-panel";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@shared/schema";
import { io, Socket } from "socket.io-client";

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser] = useState({});
  const [isPlaying, setIsPlaying] = useState(true);
  const [listenerCount, setListenerCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const socketRef = useRef<Socket | null>(null);
  const [location] = useLocation();
const userId = searchParams.get("user");
  console.log("Bhaiya ye rahi user ID: ", userId);
  const { data: room, isLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error("Failed to fetch room");
      return res.json();
    },
    enabled: !!roomId,
  });

useEffect(() => {
  if (!roomId || !userId) return;

  // Create socket connection
  socketRef.current = io(window.location.origin, {
    query: { userId }, // helps server identify this user/socket
  });
  const socket = socketRef.current;

  // Join the room via WebSocket
  socket.emit("joinRoom", { roomId, userId });

  // ✅ When YOU join (reload included) → always sync exact state from server
  socket.on("joinedRoom", (data) => {
    console.log("Successfully joined room via WebSocket:", data);

    if (data.room) {
      const count =
        data.room.listenerCount ||
        data.listenerCount ||
        data.room.members?.length ||
        0;

      setListenerCount(count);

      // Merge so we don't lose fields like code/roomId
      queryClient.setQueryData(["room", roomId], (oldRoom: any) => ({
        ...oldRoom,
        ...data.room,
        roomId: data.roomId || oldRoom?.roomId,
      }));
    }
  });

  // ✅ When OTHER users join → only update if it's not me
  socket.on("userJoined", (data) => {
    if (data.userId !== userId) {
      console.log("User joined:", data);
      toast({
        title: "User joined",
        description: `${data.user?.username || "Someone"} joined the room`,
      });

      // If server gave full room, trust it; otherwise increment
      if (data.room) {
        const count =
          data.room.listenerCount || data.room.members?.length || 0;
        setListenerCount(count);
      } else {
        setListenerCount((prev) => prev + 1);
      }
    }
  });

  // ✅ When users leave → set absolute count from server if provided
  socket.on("userLeft", (data) => {
    console.log("User left:", data);
    toast({
      title: "User left",
      description: `${data.user?.username || "Someone"} left the room`,
    });

    if (data.room) {
      const count =
        data.room.listenerCount || data.room.members?.length || 0;
      setListenerCount(count);
    } else {
      setListenerCount((prev) => Math.max(0, prev - 1));
    }
  });

  // ✅ Full room updates → always sync absolute
  socket.on("roomUpdated", (updatedRoom) => {
    console.log("Room updated:", updatedRoom);
    const newCount =
      updatedRoom.listenerCount || updatedRoom.members?.length || 0;

    setListenerCount(newCount);

    queryClient.setQueryData(["room", roomId], (oldRoom: any) => ({
      ...oldRoom,
      ...updatedRoom,
    }));
  });

  // Handle WebSocket errors
  socket.on("joinRoomError", (error) => {
    console.error("Failed to join room via WebSocket:", error);
    toast({
      title: "Connection Error",
      description: "Failed to connect to room",
      variant: "destructive",
    });
  });

  // Cleanup on unmount
  return () => {
    if (socket) {
      socket.emit("leaveRoom", { roomId, userId });
      socket.disconnect();
    }
  };
}, [roomId, userId, toast, queryClient]);

// ✅ Initial sync when room data comes from REST/query
useEffect(() => {
  if (room) {
    setListenerCount(room.listenerCount || room.members?.length || 0);
  }
}, [room]);

  // const joinRoomMutation = useMutation({
  //   mutationFn: () =>
  //     apiRequest("POST", `/api/rooms/${roomId}/join`, { userId: currentUser.id }),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
  //   },
  //   onError: () => {
  //     // Silently fail - user might already be a member
  //   },
  // });

  // // Auto-join room when component loads
  // useEffect(() => {
  //   if (room && roomId) {
  //     joinRoomMutation.mutate();
  //   }
  // }, [room?.id]);

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/songs/search", { q: searchQuery }],
    queryFn: async () => {
      const res = await axios.get<Song[]>("/api/songs/search", {
        params: { q: searchQuery },
      });
      return res.data;
    },
    enabled: searchQuery.length > 0,
  });

  const addToQueueMutation = useMutation({
    mutationFn: (songId: string) =>
      apiRequest("POST", `/api/rooms/${roomId}/queue`, {
        songId,
        addedBy: currentUser.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({ title: "Song added to queue!" });
    },
    onError: () => {
      toast({
        title: "Failed to add song",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // const voteMutation = useMutation({
  //   mutationFn: ({ queueItemId, voteType }: { queueItemId: string; voteType: 'up' | 'down' }) =>
  //     apiRequest("POST", `/api/queue/${queueItemId}/vote`, { userId: currentUser.id, voteType }),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
  //   },
  // });

// CLIENT SIDE - Add more debugging
const leaveRoomMutation = useMutation({
  mutationFn: () => {
    console.log("🔍 Attempting to leave room:", { roomId, userId });
    
    if (!roomId || !userId) {
      throw new Error(`Missing required data: roomId=${roomId}, userId=${userId}`);
    }
    
    return apiRequest("POST", `/api/rooms/${roomId}/leave`, {
      userId: userId,
    });
  },
  onSuccess: (response) => {
    console.log("✅ HTTP leave successful:", response);
    
    if (socketRef.current) {
      console.log("🔌 Emitting WebSocket leaveRoom event");
      socketRef.current.emit("leaveRoom", { roomId, userId });
    } else {
      console.warn("⚠️ No WebSocket connection available");
    }
    
    toast({
      title: "Left room",
      description: "You have successfully left the room",
    });
    setLocation("/");
  },
  onError: (error) => {
    console.error("❌ Leave room failed:", error.message);
    
    // Log the full error details
    if (error instanceof Response) {
      error.text().then(text => {
        console.error("Error response body:", text);
      });
    }
    
    toast({
      title: "Failed to leave room",
      description: "Please try again",
      variant: "destructive",
    });
  },
});
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="glass-panel p-8 rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-center">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center ml-auto mr-auto justify-center max-w-[364px] sm:max-w-md">
        <GlassPanel className="p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Room not found</h1>
          <p className="text-gray-300">
            The room you're looking for doesn't exist or has been deleted.
          </p>
        </GlassPanel>
      </div>
    );
  }

  const currentSong =
    room.queueItems?.find((item: any) => item.isPlaying);

  return (
    <div className="min-h-screen pt-24 pb-8">
      {/* Room Header */}
      <div className="container mx-auto px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 w-[100%]">
          <div>
            <h1
              className="text-2xl font-bold text-white"
              data-testid="room-name"
            >
              Room: {room.name}
            </h1>
            <p className="text-gray-300">
              {listenerCount} listeners • Room Code:
              <span
                className="font-monorounded text-sm ml-2"
                data-testid="room-code"
              >
                {room.code}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="glass-panel hover:bg-white/10 hover:text-white"
              data-testid="button-share-link"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500"
              onClick={() => leaveRoomMutation.mutate()}
              disabled={leaveRoomMutation.isPending}
              data-testid="button-leave-room"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {leaveRoomMutation.isPending ? "Leaving..." : "Leave Room"}
            </Button>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6 px-12">
        {/* Search and Add Songs */}
        <GlassPanel className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
            <Search className="w-6 h-6 mr-3 text-purple-300" />
            Add Songs
          </h2>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder="Search for songs, artists, or albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white focus:ring-2 focus:ring-purple-400 pl-12"
              data-testid="input-search-songs"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>

          {/* Search Results */}
          <div className="space-y-3 mb-6">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((song: any) => (
                <div
                  key={song.id}
                  className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-all group cursor-pointer"
                  data-testid={`search-result-${song.id}`}
                >
                  <img
                    src={
                      song.thumbnail ||
                      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop&crop=center"
                    }
                    alt={`${song.title} artwork`}
                    className="w-12 h-12 rounded-lg object-cover mr-4"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">
                      {song.title}
                    </p>
                    <p className="text-gray-400 text-xs">{song.artist}</p>
                  </div>
                  <Button
                    // size="sm"
                    variant="ghost"
                    onClick={() => addToQueueMutation.mutate(song.id)}
                    className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-[50%]"
                    data-testid={`button-add-song-${song.id}`}
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </Button>
                </div>
              ))
            ) : searchQuery.length > 2 ? (
              <p className="text-center text-gray-400 py-8">No songs found</p>
            ) : null}
          </div>
        </GlassPanel>

        {/* Now Playing */}
        <GlassPanel className="p-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
            <Play className="w-6 h-6 mr-3 text-green-400" />
            Now Playing
          </h2>

          {currentSong ? (
            <>
              {/* Album Artwork */}
              <div className="relative mb-6 group">
                <img
                  src={
                    currentSong.song.thumbnail ||
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=280&h=280&fit=crop&crop=center"
                  }
                  alt={`${currentSong.song.title} artwork`}
                  className="w-70 h-70 rounded-xl shadow-2xl object-cover animate-float"
                  data-testid="current-song-artwork"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              {/* Song Info */}
              <div className="mb-6">
                <h3
                  className="text-2xl font-bold mb-2 text-white"
                  data-testid="current-song-title"
                >
                  {currentSong.song.title}
                </h3>
                <p
                  className="text-gray-300 text-lg"
                  data-testid="current-song-artist"
                >
                  {currentSong.song.artist}
                </p>
                {currentSong.song.album && (
                  <p
                    className="text-gray-400 text-sm mt-1"
                    data-testid="current-song-album"
                  >
                    {currentSong.song.album}
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>2:14</span>
                  <span>
                    {Math.floor((currentSong.song.duration || 180) / 60)}:
                    {(currentSong.song.duration || 180) % 60}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all w-3/5"></div>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center space-x-6 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-2xl hover:text-purple-300 transition-colors"
                  data-testid="button-previous"
                >
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-full btn-glow"
                  onClick={() => setIsPlaying(!isPlaying)}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-2xl hover:text-purple-300 transition-colors"
                  data-testid="button-next"
                >
                  <SkipForward className="w-6 h-6" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400">No songs in queue</p>
            </div>
          )}
        </GlassPanel>

        {/* Queue List */}
        <GlassPanel className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
            <Music className="w-6 h-6 mr-3 text-blue-300" />
            Up Next
          </h2>

          {/* Queue Items */}
          <div className="space-y-3 mb-6">
            {room.queueItems
              ?.filter((item: any ) => !item.isPlaying)
              .map((item: any, index: any) => (
                <div
                  key={item.id}
                  className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-all group"
                  data-testid={`queue-item-${item.id}`}
                >
                  <div className="text-gray-400 text-sm w-8 text-center mr-3">
                    {index + 1}
                  </div>
                  <img
                    src={
                      item.song.thumbnail ||
                      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50&h=50&fit=crop&crop=center"
                    }
                    alt={`${item.song.title} artwork`}
                    className="w-10 h-10 rounded-lg object-cover mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-white">
                      {item.song.title}
                    </p>
                    <p className="text-gray-400 text-xs">{item.song.artist}</p>
                    <p className="text-gray-500 text-xs">
                      Added by <span>{item.addedByUser.username}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        voteMutation.mutate({
                          queueItemId: item.id,
                          voteType: "up",
                        })
                      }
                      className="text-green-500 transition-colors hover:bg-black/20 p-1"
                      data-testid={`button-upvote-${item.id}`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <span
                      className="text-sm font-semibold min-w-[20px] text-center text-white"
                      data-testid={`vote-count-${item.id}`}
                    >
                      +{item.votes || 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        voteMutation.mutate({
                          queueItemId: item.id,
                          voteType: "down",
                        })
                      }
                      className="text-red-500 transition-colors hover:bg-black/20 hover:text-red-500 p-1"
                      data-testid={`button-downvote-${item.id}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

            {room.queueItems?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">Queue is empty. Add some songs!</p>
              </div>
            )}
          </div>

          {/* Queue Actions */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full glass-panel p-3 hover:bg-white/20 text-white"
              data-testid="button-clear-queue"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Queue
            </Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
