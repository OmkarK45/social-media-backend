import SecurePassword from 'secure-password'

const securePassword = new SecurePassword()

export async function hashPassword(password: string) {
	return await securePassword.hash(Buffer.from(password))
}

export async function verifyPassword(hashedPassword: Buffer, password: string) {
	try {
		return await securePassword.verify(Buffer.from(password), hashedPassword)
	} catch (error) {
		return SecurePassword.INVALID
	}
}

export function isValidPassword(validity: symbol) {
	return [SecurePassword.VALID, SecurePassword.VALID_NEEDS_REHASH].includes(
		validity
	)
}
