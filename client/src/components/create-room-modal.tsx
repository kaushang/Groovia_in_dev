import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createRoomMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest("POST", "/api/rooms", { name }),
    onSuccess: async (response) => {
      const room = await response.json();
      toast({
        title: "Room created!",
        description: `${room.name} has been created successfully`,
      });
      onClose();
      setLocation(`/room/${room.id}`);
    },
    onError: () => {
      toast({
        title: "Failed to create room",
        description: "Please try again",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = roomName.trim();
    
    if (name.length === 0) {
      toast({
        title: "Room name required",
        description: "Please enter a room name",
        variant: "destructive"
      });
      return;
    }
    
    if (name.length > 16) {
      toast({
        title: "Name too long",
        description: "Room name must be 16 characters or less",
        variant: "destructive"
      });
      return;
    }

    createRoomMutation.mutate(name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > 16) value = value.slice(0, 16);
    setRoomName(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/20 bg-gray text-white max-w-[364px] sm:max-w-md" data-testid="create-room-modal">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold mb-0 text-center">Create a Room</DialogTitle>
          {/* <p className="text-gray-300 text-sm font-normal text-center">Enter a name for your new room</p> */}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            
          <div>
            {/* <Label htmlFor="roomName" className="text-gray-300 text-lg">Room Name</Label> */}
            <Input
              id="roomName"
              type="text"
              value={roomName}
              onChange={handleNameChange}
              placeholder="Enter Room Name (max 16 chars)"
              className="bg-white/10 border-white/20 placeholder:text-white-400 text-center text-lg mt-2"
              data-testid="input-room-name"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              type="button" 
              onClick={onClose} 
              variant="ghost" 
              className="flex-1 glass-panel hover:bg-white/10 hover:text-white"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
              disabled={createRoomMutation.isPending}
              data-testid="button-create"
            >
              {createRoomMutation.isPending ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}