import React from "react";
import { AlertTriangle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function DisconnectPlatformModal({
    open,
    onOpenChange,
    platformName,
    onConfirm,
    isPending
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <AlertDialogTitle>Disconnect Platform?</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                                Are you sure you want to disconnect <span className="text-white font-medium">{platformName}</span>?
                            </AlertDialogDescription>
                        </div>
                    </div>
                    <div className="text-sm text-white/50 bg-white/5 p-4 rounded-lg border border-white/5 mt-2">
                        <ul className="list-disc list-inside space-y-1">
                            <li>Data sync will stop immediately</li>
                            <li>Existing data will be retained</li>
                            <li>You can reconnect at any time</li>
                        </ul>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-white/60 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        {isPending ? "Disconnecting..." : "Disconnect Platform"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
