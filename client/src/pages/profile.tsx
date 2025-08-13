import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Clock, Users, Star, History, UserPlus, Edit } from "lucide-react";
import GlassPanel from "@/components/glass-panel";
import type { User } from "@shared/schema";

// Mock data for demo
const mockUser = {
  id: "demo-user",
  username: "sarahmusic",
  email: "sarah@example.com",
  fullName: "Sarah Chen",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
  songsPlayed: 347,
  hoursListened: 23,
  roomsJoined: 12,
  createdAt: new Date()
};

const recentSongs = [
  {
    id: "1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop&crop=center",
    playedAt: "2 hours ago"
  },
  {
    id: "2",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50&h=50&fit=crop&crop=center",
    playedAt: "5 hours ago"
  },
  {
    id: "3",
    title: "Levitating",
    artist: "Dua Lipa",
    thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=50&h=50&fit=crop&crop=center",
    playedAt: "1 day ago"
  }
];

const topArtists = [
  {
    name: "The Weeknd",
    playCount: 23,
    percentage: 85,
    avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop&crop=face"
  },
  {
    name: "Olivia Rodrigo",
    playCount: 18,
    percentage: 70,
    avatar: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50&h=50&fit=crop&crop=face"
  },
  {
    name: "Dua Lipa",
    playCount: 15,
    percentage: 60,
    avatar: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=50&h=50&fit=crop&crop=face"
  }
];

const friendsActivity = [
  {
    username: "Mike",
    action: "added a song",
    time: "15 min ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    icon: Music
  },
  {
    username: "Emma",
    action: "created a room",
    time: "1 hour ago",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
    icon: Users
  },
  {
    username: "Alex",
    action: "upvoted a song",
    time: "2 hours ago",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    icon: Star
  }
];

const playlists = [
  {
    name: "Friday Night Vibes",
    songCount: 23,
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=center"
  },
  {
    name: "Chill Afternoon",
    songCount: 17,
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop&crop=center"
  },
  {
    name: "Workout Energy",
    songCount: 31,
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150&h=150&fit=crop&crop=center"
  }
];

export default function Profile() {
  const user = mockUser; // In real app, fetch from API

  return (
    <div className="min-h-screen px-6 pt-24 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <GlassPanel className="p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Avatar */}
            <img 
              src={user.avatar} 
              alt="User profile picture" 
              className="w-24 h-24 rounded-full object-cover border-4 border-purple-300" 
              data-testid="profile-avatar"
            />
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 text-white" data-testid="profile-name">{user.fullName}</h1>
              <p className="text-gray-300 mb-1" data-testid="profile-username">@{user.username}</p>
              <p className="text-gray-400 text-sm mb-4">Member since March 2024</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <Music className="w-4 h-4 mr-2 text-purple-300" />
                  <span data-testid="songs-played">{user.songsPlayed}</span> songs played
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-300" />
                  <span data-testid="hours-listened">{user.hoursListened}</span> hours listening
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-green-300" />
                  <span data-testid="rooms-joined">{user.roomsJoined}</span> rooms joined
                </div>
              </div>
            </div>
            
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 btn-glow" data-testid="button-edit-profile">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </GlassPanel>

        {/* Profile Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Recently Played */}
          <GlassPanel className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center text-white">
              <History className="w-5 h-5 mr-3 text-purple-300" />
              Recently Played
            </h2>
            <div className="space-y-3">
              {recentSongs.map((song) => (
                <div key={song.id} className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-all" data-testid={`recent-song-${song.id}`}>
                  <img 
                    src={song.thumbnail} 
                    alt={`${song.title} artwork`} 
                    className="w-12 h-12 rounded-lg object-cover mr-3" 
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-white">{song.title}</p>
                    <p className="text-gray-400 text-xs">{song.artist}</p>
                    <p className="text-gray-500 text-xs">{song.playedAt}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" className="w-full mt-4 text-purple-300 hover:text-purple-200 text-sm p-0" data-testid="button-view-history">
              View Full History
            </Button>
          </GlassPanel>

          {/* Top Artists */}
          <GlassPanel className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center text-white">
              <Star className="w-5 h-5 mr-3 text-yellow-300" />
              Top Artists
            </h2>
            <div className="space-y-4">
              {topArtists.map((artist, index) => (
                <div key={index} className="flex items-center justify-between" data-testid={`top-artist-${index}`}>
                  <div className="flex items-center">
                    <img 
                      src={artist.avatar} 
                      alt={`${artist.name} photo`} 
                      className="w-12 h-12 rounded-full object-cover mr-3" 
                    />
                    <div>
                      <p className="font-medium text-sm text-white">{artist.name}</p>
                      <p className="text-gray-400 text-xs">{artist.playCount} plays</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 bg-white/20 rounded-full h-1 mb-1">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1 rounded-full" 
                        style={{ width: `${artist.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400">{artist.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Friends Activity */}
          <GlassPanel className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center text-white">
              <Users className="w-5 h-5 mr-3 text-green-300" />
              Friends Activity
            </h2>
            <div className="space-y-3">
              {friendsActivity.map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div key={index} className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-all" data-testid={`friend-activity-${index}`}>
                    <img 
                      src={activity.avatar} 
                      alt={`${activity.username} avatar`} 
                      className="w-10 h-10 rounded-full object-cover mr-3" 
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        <span className="font-medium">{activity.username}</span> 
                        <span className="text-gray-400 ml-1">{activity.action}</span>
                      </p>
                      <p className="text-gray-500 text-xs">{activity.time}</p>
                    </div>
                    <IconComponent className="w-4 h-4 text-purple-300" />
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" className="w-full mt-4 glass-panel p-3 hover:bg-white/20 text-white" data-testid="button-add-friends">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friends
            </Button>
          </GlassPanel>
        </div>

        {/* Playlists Section */}
        <GlassPanel className="p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 flex items-center text-white">
            <Music className="w-5 h-5 mr-3 text-cyan-300" />
            My Playlists
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {playlists.map((playlist, index) => (
              <div key={index} className="glass-panel p-4 rounded-lg hover:bg-white/10 transition-all cursor-pointer group" data-testid={`playlist-${index}`}>
                <img 
                  src={playlist.cover} 
                  alt={`${playlist.name} cover`} 
                  className="w-full aspect-square rounded-lg object-cover mb-3 group-hover:scale-105 transition-transform" 
                />
                <h3 className="font-semibold text-sm mb-1 text-white">{playlist.name}</h3>
                <p className="text-gray-400 text-xs">{playlist.songCount} songs</p>
              </div>
            ))}
            <div className="glass-panel p-4 rounded-lg hover:bg-white/10 transition-all cursor-pointer group border-2 border-dashed border-purple-300" data-testid="button-create-playlist">
              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-3">
                <span className="text-4xl text-white opacity-70">+</span>
              </div>
              <h3 className="font-semibold text-sm mb-1 text-white">Create New</h3>
              <p className="text-gray-400 text-xs">Add songs</p>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
