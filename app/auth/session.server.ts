import jwt from 'jsonwebtoken'
import { generators, Issuer } from 'openid-client'
import { config } from '~/config.server'

import { createCookieSessionStorage, redirect } from '@remix-run/node'

import type { Client } from "openid-client"

let client: Client

async function getClient(): Promise<Client> {
  if (client !== undefined) {
    return client
  }
  
  const issuer = await Issuer.discover(config.oidcIssuer)
  client = new issuer.Client({
    client_id: config.oidcClientID,
    client_secret: config.oidcClientSecret,
    redirect_uris: [`${config.oidcRedirectBase}/auth/callback`],
    response_types: ['code'],
  })
  return client
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [config.sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
})

export async function requireUserSession(request: Request) {
  const client = await getClient()
  const currentCookie = request.headers.get("cookie")
  const session = await sessionStorage.getSession(currentCookie)

  if (!session.has("access_token")) {
    const codeVerifier = generators.codeVerifier()
    session.set("code_verifier", codeVerifier)
    session.set("return_to", request.url)
    const cookie = await sessionStorage.commitSession(session)
    throw redirect(
      client.authorizationUrl({
        scope: "openid",
        audience: config.oidcAudience,
        code_challenge: generators.codeChallenge(codeVerifier),
        code_challenge_method: "S256",
      }),
      {
        headers: {
          "Set-Cookie": cookie,
        },
      }
    )
  }

  return session
}

export async function authorizeUser(request: Request) {
  const client = await getClient()
  const currentCookie = request.headers.get("cookie")
  const session = await sessionStorage.getSession(currentCookie)
  const codeVerifier = session.get("code_verifier")
  
  if (typeof codeVerifier !== "string" || codeVerifier.length === 0) {
    // you may want to log this at a warn level
    throw new Error("unauthorized")
  }
  
  const params = client.callbackParams(request.url)
  const tokenSet = await client.callback(
    `${config.oidcRedirectBase}/auth/callback`,
    params,
    { code_verifier: codeVerifier }
  )
  
  if (tokenSet.access_token) {
    session.set("access_token", tokenSet.access_token)
    session.set("id_token", tokenSet.id_token)

    // provide any session data you wish to have after the user is authenticated
    session.set("user", jwt.decode(tokenSet.access_token))
  }

  let redirectLocation = "/"
  if (session.has("return_to")) {
    redirectLocation = session.get("return_to")
    session.unset("return_to")
  }
  
  const cookie = await sessionStorage.commitSession(session)
  
  throw redirect(redirectLocation, {
    headers: {
      "Set-Cookie": cookie,
    },
  })
}

export async function logoutUser(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("cookie"))
  const cookie = await sessionStorage.destroySession(session)
  const returnTo = encodeURIComponent(`${config.oidcRedirectBase}/auth/logout-success`)
  
  // This is a non-standard logout, since Auth0 does not have the end_session_url in their openid-configuration
  throw redirect(`${config.oidcIssuer}/v2/logout?client_id=${config.oidcClientID}&returnTo=${returnTo}`, {
    headers: {
      "Set-Cookie": cookie
    }
  })
}
