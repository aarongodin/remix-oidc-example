import type { LoaderFunction } from "@remix-run/node"
import { logoutUser } from '~/auth/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  await logoutUser(request)
}

export default function Logout() {
  // todo: could show custom messages for auth issues
}