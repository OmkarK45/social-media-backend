import { PrismaClient, Prisma } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function getPwd() {
	return await hashPassword('123456')
}

const userData = [...Array(21).keys()].slice(1)

async function main() {
	console.log(`Start seeding ...`)
	for (const [u, i] of userData.entries()) {
		const user = await prisma.user.create({
			data: {
				email: `demo_account${u}@gmail.com`,
				username: `demo_account_${u}`,
				firstName: `demo_firstName_${u}`,
				hashedPassword: await getPwd(),
				bio: `Hello my name is demo_account_${u}. Have a good day`,
				following: {
					connect: {
						username: 'james_brown',
					},
				},
			},
		})
		console.log(`Created user with id: ${user.id}`)
	}
	console.log(`Seeding finished.`)
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
