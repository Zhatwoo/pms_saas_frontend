import { redirect } from "next/navigation";

export default function EmployeeQrReplacementsRedirectPage() {
  redirect("/employee/inventory/pawned-items");
}
