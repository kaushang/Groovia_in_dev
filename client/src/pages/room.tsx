import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Music, Search, Play, Pause, SkipBack, SkipForward, Volume2, Users, Share, QrCode, ExternalLink, LogOut, ChevronUp, ChevronDown, Plus, Shuffle, Trash2 } from "lucide-react";
import GlassPanel from "@/components/glass-panel";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RoomWithDetails, Song, QueueItemWithSong } from "@shared/schema";

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser] = useState({ id: "demo-user", username: "You" }); // Mock user
  const [isPlaying, setIsPlaying] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: room, isLoading } = useQuery<RoomWithDetails>({
    queryKey: ["/api/rooms", roomId],
    enabled: !!roomId,
  });

  const { data: searchResults = [], isLoading: isSearching } = useQuery<Song[]>({
    queryKey: ["/api/songs/search", { q: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const addToQueueMutation = useMutation({
    mutationFn: (songId: string) =>
      apiRequest("POST", `/api/rooms/${roomId}/queue`, { songId, addedBy: currentUser.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({ title: "Song added to queue!" });
    },
    onError: () => {
      toast({
        title: "Failed to add song",
        description: "Please try again",
        variant: "destructive"
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ queueItemId, voteType }: { queueItemId: string; voteType: 'up' | 'down' }) =>
      apiRequest("POST", `/api/queue/${queueItemId}/vote`, { userId: currentUser.id, voteType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
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
      <div className="min-h-screen flex items-center justify-center pt-20">
        <GlassPanel className="p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Room not found</h1>
          <p className="text-gray-300">The room you're looking for doesn't exist or has been deleted.</p>
        </GlassPanel>
      </div>
    );
  }

  const currentSong = room.queueItems.find(item => item.isPlaying) || room.queueItems[0];

  return (
    <div className="min-h-screen px-6 pt-24 pb-8">
      {/* Room Header */}
      <GlassPanel className="p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white" data-testid="room-name">
              Room: {room.name}
            </h1>
            <p className="text-gray-300">
              {room.listenerCount} listeners • Room Code: 
              <span className="font-mono bg-purple-500 px-2 py-1 rounded text-sm ml-2" data-testid="room-code">
                {room.code}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" size="sm" className="glass-panel hover:bg-white/10 hover:text-white" data-testid="button-share-link">
              <ExternalLink className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-red-700 to-red-600 " data-testid="button-leave-room">
              <LogOut className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </div>
      </GlassPanel>

      {/* Three Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        
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
              searchResults.map((song) => (
                <div key={song.id} className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-all group cursor-pointer" data-testid={`search-result-${song.id}`}>
                  <img 
                    src={song.thumbnail || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop&crop=center"} 
                    alt={`${song.title} artwork`} 
                    className="w-12 h-12 rounded-lg object-cover mr-4" 
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">{song.title}</p>
                    <p className="text-gray-400 text-xs">{song.artist}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addToQueueMutation.mutate(song.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-full btn-glow"
                    data-testid={`button-add-song-${song.id}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))
            ) : searchQuery.length > 2 ? (
              <p className="text-center text-gray-400 py-8">No songs found</p>
            ) : null}
          </div>

          {/* Quick Add Categories */}
          {/* <div>
            <h3 className="text-lg font-semibold mb-3 text-white">Quick Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" className="glass-panel p-3 h-auto flex-col hover:bg-white/20">
                <span className="text-orange-400 mb-2">🔥</span>
                <span className="text-sm">Trending</span>
              </Button>
              <Button variant="ghost" className="glass-panel p-3 h-auto flex-col hover:bg-white/20">
                <span className="text-red-400 mb-2">❤️</span>
                <span className="text-sm">Favorites</span>
              </Button>
            </div>
          </div> */}
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
                  src={currentSong.song.thumbnail || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=280&h=280&fit=crop&crop=center"} 
                  alt={`${currentSong.song.title} artwork`} 
                  className="w-70 h-70 rounded-xl shadow-2xl object-cover animate-float" 
                  data-testid="current-song-artwork"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              {/* Song Info */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-white" data-testid="current-song-title">{currentSong.song.title}</h3>
                <p className="text-gray-300 text-lg" data-testid="current-song-artist">{currentSong.song.artist}</p>
                {currentSong.song.album && (
                  <p className="text-gray-400 text-sm mt-1" data-testid="current-song-album">{currentSong.song.album}</p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>2:14</span>
                  <span>{Math.floor((currentSong.song.duration || 180) / 60)}:{(currentSong.song.duration || 180) % 60}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all w-3/5"></div>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center space-x-6 mb-6">
                <Button variant="ghost" size="sm" className="text-2xl hover:text-purple-300 transition-colors" data-testid="button-previous">
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-full btn-glow"
                  onClick={() => setIsPlaying(!isPlaying)}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </Button>
                <Button variant="ghost" size="sm" className="text-2xl hover:text-purple-300 transition-colors" data-testid="button-next">
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
              .filter(item => !item.isPlaying)
              .map((item, index) => (
                <div key={item.id} className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-all group" data-testid={`queue-item-${item.id}`}>
                  <div className="text-gray-400 text-sm w-8 text-center mr-3">{index + 1}</div>
                  <img 
                    src={item.song.thumbnail || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50&h=50&fit=crop&crop=center"} 
                    alt={`${item.song.title} artwork`} 
                    className="w-10 h-10 rounded-lg object-cover mr-3" 
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-white">{item.song.title}</p>
                    <p className="text-gray-400 text-xs">{item.song.artist}</p>
                    <p className="text-gray-500 text-xs">Added by <span>{item.addedByUser.username}</span></p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => voteMutation.mutate({ queueItemId: item.id, voteType: 'up' })}
                      className="text-green-500 transition-colors hover:bg-black/20 p-1"
                      data-testid={`button-upvote-${item.id}`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-semibold min-w-[20px] text-center text-white" data-testid={`vote-count-${item.id}`}>
                      +{item.votes || 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => voteMutation.mutate({ queueItemId: item.id, voteType: 'down' })}
                      className="text-red-500 transition-colors hover:bg-black/20 hover:text-red-500 p-1"
                      data-testid={`button-downvote-${item.id}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            
            {room.queueItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">Queue is empty. Add some songs!</p>
              </div>
            )}
          </div>

          {/* Queue Actions */}
          <div className="space-y-3">
            <Button variant="ghost" className="w-full glass-panel p-3 hover:bg-white/20 text-white" data-testid="button-clear-queue">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Queue
            </Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
