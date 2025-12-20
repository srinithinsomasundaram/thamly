import { redirect } from "next/navigation"

export default function WorkspaceRootRedirect() {
  redirect("/drafts")
}
