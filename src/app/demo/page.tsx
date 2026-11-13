import { redirect } from "next/navigation";

// The public demo editor is retired; the example menu lives on the home page.
export default function DemoPage() {
  redirect("/#demo");
}
