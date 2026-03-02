import { Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Profile() {
  return <Navigate to={createPageUrl("Settings")} replace />;
}
