import type { LoaderFunction } from "@remix-run/node"
import { authorizeUser } from '~/auth/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  await authorizeUser(request)
}

export default function AuthCallback() {
  // todo: should show custom messages for auth issues
}
