import React from 'react';
import { Bell, BellOff, Loader2, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PushNotificationToggleProps {
  variant?: 'switch' | 'button';
  showTestButton?: boolean;
}

export const PushNotificationToggle: React.FC<PushNotificationToggleProps> = ({
  variant = 'switch',
  showTestButton = false,
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Push notifications are not supported on this device/browser.
        </AlertDescription>
      </Alert>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (variant === 'button') {
    return (
      <div className="space-y-3">
        <Button
          onClick={handleToggle}
          disabled={isLoading}
          variant={isSubscribed ? 'outline' : 'default'}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isSubscribed ? (
            <BellOff className="w-4 h-4 mr-2" />
          ) : (
            <Bell className="w-4 h-4 mr-2" />
          )}
          {isSubscribed ? 'Disable Push Notifications' : 'Enable Push Notifications'}
        </Button>
        
        {showTestButton && isSubscribed && (
          <Button
            onClick={sendTestNotification}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Send Test Notification
          </Button>
        )}
        
        {permission === 'denied' && (
          <p className="text-xs text-destructive">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Label htmlFor="push-notifications" className="font-medium cursor-pointer">
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified even when the app is closed
            </p>
          </div>
        </div>
        
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={permission === 'denied'}
          />
        )}
      </div>
      
      {permission === 'denied' && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Notifications are blocked. Enable them in your browser settings to receive push notifications.
          </AlertDescription>
        </Alert>
      )}
      
      {showTestButton && isSubscribed && (
        <Button
          onClick={sendTestNotification}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          Send Test Notification
        </Button>
      )}
    </div>
  );
};
