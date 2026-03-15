import { MapPin, Phone, Star, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SavedAddress } from '@/hooks/useSavedAddresses';

interface SavedAddressCardProps {
  address: SavedAddress;
  onEdit: (address: SavedAddress) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onSelect?: (address: SavedAddress) => void;
  selectable?: boolean;
}

export const SavedAddressCard = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  onSelect,
  selectable = false,
}: SavedAddressCardProps) => {
  return (
    <Card 
      className={`transition-all duration-200 ${
        selectable 
          ? 'cursor-pointer hover:border-foreground/30 hover:shadow-md' 
          : ''
      } ${address.is_default ? 'border-foreground/20 bg-muted/30' : ''}`}
      onClick={() => selectable && onSelect?.(address)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {address.label}
              </h3>
              {address.is_default && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Default
                </Badge>
              )}
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-1">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="line-clamp-2">
                {address.address}, {address.city}
                {address.postal_code && ` - ${address.postal_code}`}
              </span>
            </div>

            {address.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{address.phone}</span>
              </div>
            )}

            {address.instructions && (
              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">
                "{address.instructions}"
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(address)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {!address.is_default && (
                <DropdownMenuItem onClick={() => onSetDefault(address.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  Set as default
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(address.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
