import type { LoaderFunction } from "@remix-run/node"

import { requireUserSession } from '~/auth/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request)
  return null
}

export default function About() {
  return (
    <div>
      This is a basic about page. You can use it to test that the session storage works
      for redirecting the user to the requested page.
    </div>
  );
}
