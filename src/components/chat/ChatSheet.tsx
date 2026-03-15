import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChatWindow } from './ChatWindow';

interface ChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryRequestId: string | null;
  otherPartyName?: string;
}

export const ChatSheet: React.FC<ChatSheetProps> = ({
  open,
  onOpenChange,
  deliveryRequestId,
  otherPartyName,
}) => {
  if (!deliveryRequestId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 w-full sm:max-w-md">
        <ChatWindow
          deliveryRequestId={deliveryRequestId}
          otherPartyName={otherPartyName}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
};
