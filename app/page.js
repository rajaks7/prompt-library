// app/page.js
import { redirect } from "next/navigation";

export default function Page() {
  // permanent redirect from root to /library
  redirect("/library");
}
