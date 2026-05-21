import { redirect } from "next/navigation";

export default function AdminQrReplacementsRedirectPage() {
  redirect("/admin/inventory/pawned-items");
}
