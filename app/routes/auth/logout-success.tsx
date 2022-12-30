import { Link } from '@remix-run/react'

export default function LogoutSuccess() {
  return (
    <main>
      <h2>Logout successful</h2>
      <p>
        You have been successfully logged out. You can <Link to="/">login</Link> again.
      </p>
    </main>
  )
}
