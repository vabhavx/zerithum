import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ConnectCredentialsDialog({
  open,
  onOpenChange,
  selectedPlatform,
  shopName,
  onShopNameChange,
  apiKey,
  onApiKeyChange,
  onConnect,
  isConnecting,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border border-white/10 bg-[#111114] text-[#F5F5F5]">
        <DialogHeader>
          <DialogTitle>
            Connect {selectedPlatform?.name || "platform"}
          </DialogTitle>
          <DialogDescription className="text-white/65">
            Enter required connection details to complete setup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {selectedPlatform?.requiresShopName && (
            <div>
              <Label
                htmlFor="shop-name"
                className="mb-2 block text-sm text-white/80"
              >
                Shopify store name
              </Label>
              <Input
                id="shop-name"
                value={shopName}
                onChange={(event) => onShopNameChange(event.target.value)}
                placeholder="your-store"
                className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
              />
            </div>
          )}

          {selectedPlatform?.requiresApiKey && (
            <div>
              <Label
                htmlFor="api-key"
                className="mb-2 block text-sm text-white/80"
              >
                API key
              </Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(event) => onApiKeyChange(event.target.value)}
                placeholder="Enter API key"
                className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
              />
            </div>
          )}

          <Button
            type="button"
            onClick={onConnect}
            disabled={isConnecting}
            className="h-9 w-full bg-[#56C5D0] text-[#0A0A0A] hover:bg-[#48AAB5]"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
