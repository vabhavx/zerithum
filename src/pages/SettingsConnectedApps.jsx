import { Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SettingsConnectedApps() {
  return <Navigate to={createPageUrl("ConnectedPlatforms")} replace />;
}
