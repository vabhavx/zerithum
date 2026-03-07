import { Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SettingsAccount() {
  return <Navigate to={createPageUrl("Settings")} replace />;
}