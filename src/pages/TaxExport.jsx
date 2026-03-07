import { Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TaxExport() {
  return <Navigate to={createPageUrl("TaxReports")} replace />;
}