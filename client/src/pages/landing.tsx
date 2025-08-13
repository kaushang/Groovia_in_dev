import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Users, Vote, Share } from "lucide-react";
import JoinRoomModal from "@/components/join-room-modal";
import GlassPanel from "@/components/glass-panel";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "@shared/schema";
import { FaPlus } from "react-icons/fa";
import { BiDoorOpen } from "react-icons/bi";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { toast } = useToast();

  const createRoomMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/rooms", {
        name: "My Music Room",
        createdBy: "demo-user", // In real app, use actual user ID
      }),
    onSuccess: async (response) => {
      const room: Room = await response.json();
      toast({
        title: "Room created!",
        description: `Room code: ${room.code}`,
      });
      setLocation(`/room/${room.id}`);
    },
    onError: () => {
      toast({
        title: "Failed to create room",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const createRoom = () => {
    createRoomMutation.mutate();
  };

  const features = [
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Listen together with friends in synchronized rooms",
      color: "text-purple-300",
    },
    {
      icon: Vote,
      title: "Democratic Queue",
      description: "Vote on songs to shape the perfect playlist",
      color: "text-blue-300",
    },
    {
      icon: Share,
      title: "Easy Sharing",
      description: "Share rooms with links, codes, or QR codes",
      color: "text-cyan-300",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 pt-20">
      <div className="text-center max-w-4xl mx-auto">
        {/* Hero Logo and Animation */}
        <div className="mb-8 relative">
          <div className="text-8xl md:text-9xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent animate-float">
            {/* <Music className="inline-block mr-4 h-20 w-20 md:h-24 md:w-24" /> */}
            Groovia
          </div>
        </div>

        {/* Tagline */}
        <h2 className="text-2xl md:text-3xl font-light text-gray-200 mb-12 animate-pulse-soft">
          Because music is better together
        </h2>

        {/* Main Action Buttons */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-16">
          <Button
            onClick={createRoom}
            size="lg"
            className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 px-8 py-6 text-xl font-semibold btn-glow group"
            disabled={createRoomMutation.isPending}
            data-testid="button-create-room"
          >
            <span className="">
              <FaPlus style={{ width: "18px", height: "18px" }} />
            </span>
            {createRoomMutation.isPending ? "Creating..." : "Create Room"}
          </Button>
          <Button
            onClick={() => setShowJoinModal(true)}
            size="lg"
            className="w-full md:w-auto glass-panel hover:bg-white px-8 py-6 text-xl font-semibold hover:bg-opacity-20 transition-all text-white hover:text-white"
            data-testid="button-join-room"
          >
            <span className="mr-2">
              <BiDoorOpen style={{ width: "22px", height: "22px" }} />
            </span>
            Join Room
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <GlassPanel
                key={index}
                className="p-6 text-center group hover:scale-105 transition-transform"
                data-testid={`feature-card-${index}`}
              >
                <div
                  className={`text-4xl mb-4 ${feature.color} group-hover:animate-bounce`}
                >
                  <IconComponent className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </GlassPanel>
            );
          })}
        </div>
      </div>

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
}
