import { redirect } from "next/navigation";

export default function EmployeeInventoryRootPage() {
  redirect("/employee/inventory/pawned-items");
}
