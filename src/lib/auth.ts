import SecurePassword from 'secure-password'

import { User } from '@prisma/client'
import { AuthenticationError, ValidationError } from 'apollo-server-errors'

import { prisma } from './db'
import { hashPassword, verifyPassword } from './password'

export async function login(email: string, password: string): Promise<User> {
	const user = await prisma.user.findFirst({
		where: {
			email: {
				equals: email,
				mode: 'insensitive',
			},
		},
	})

	if (!user) {
		throw new AuthenticationError(
			'No account with those credentials was found.'
		)
	}

	const status = await verifyPassword(user.hashedPassword, password)

	switch (status) {
		case SecurePassword.VALID:
			break
		case SecurePassword.VALID_NEEDS_REHASH:
			const newHash = await hashPassword(password)
			await prisma.user.update({
				where: { id: user.id },
				data: { hashedPassword: newHash },
			})
			break
		case SecurePassword.INVALID:
			throw new ValidationError('Password is incorrect.')
	}
	return user
}
