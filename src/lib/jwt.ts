import { AuthenticationError } from 'apollo-server-errors'
import jwt from 'jsonwebtoken'

import { config } from './config'

export type Payload = Record<string, unknown>

export function createToken(
	payload: Payload,
	options?: jwt.SignOptions
): string {
	try {
		const token = jwt.sign(payload, config.auth.secret, {
			issuer: '@dogecorp/api',
			audience: ['@dogecorp/client'],
			expiresIn: config.auth.expiresIn,
			...options,
		})
		return token
	} catch (error) {
		throw error
	}
}

export function decryptToken<T>(token: string): T {
	try {
		const isVerified = jwt.verify(token, config.auth.secret)

		if (!isVerified) throw new AuthenticationError('Token has been malformed.')

		const payload = jwt.decode(token)
		return payload as T
	} catch (error) {
		throw error
	}
}
