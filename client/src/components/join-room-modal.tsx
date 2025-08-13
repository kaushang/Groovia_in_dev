import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const [roomCode, setRoomCode] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const joinRoomMutation = useMutation({
    mutationFn: (code: string) =>
      apiRequest("GET", `/api/rooms/code/${code}`),
    onSuccess: async (response) => {
      const room = await response.json();
      toast({
        title: "Joined room!",
        description: `Welcome to ${room.name}`,
      });
      onClose();
      setLocation(`/room/${room.id}`);
    },
    onError: () => {
      toast({
        title: "Room not found",
        description: "Please check the room code and try again",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (code.length === 6) {
      joinRoomMutation.mutate(code);
    } else {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit room code",
        variant: "destructive"
      });
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (value.length > 6) value = value.slice(0, 6);
    setRoomCode(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/20 text-white max-w-md" data-testid="join-room-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-2 text-center">Join a Room</DialogTitle>
          <p className="text-gray-300 text-sm font-normal text-center">Enter the room code to join your friends</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="roomCode" className="text-gray-300">Room Code</Label>
            <Input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={handleCodeChange}
              placeholder="Enter 6-digit code (e.g., FV2024)"
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 text-center text-lg font-mono uppercase tracking-widest"
              data-testid="input-room-code"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              type="button" 
              onClick={onClose} 
              variant="ghost" 
              className="flex-1 glass-panel hover:bg-white/20 text-white"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 btn-glow"
              disabled={joinRoomMutation.isPending}
              data-testid="button-join"
            >
              {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
