import { PrismaClient, Prisma } from '@prisma/client'
import { getAvatar, getCoverImages } from '../src/graphql/utils/avatar'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function getPwd() {
	return await hashPassword('123456')
}

const userData = [...Array(31).keys()].slice(1)
const postData = [...Array(10).keys()].slice(1)

async function seedUsers() {
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
				avatar: getAvatar(),
				coverImage: getCoverImages(),
			},
		})
		console.log(`Created user with id: ${user.id}`)
	}
}

async function seedPosts() {
	for (const [p, i] of postData.entries()) {
		const post = await prisma.post.create({
			data: {
				caption: `[${i}]Example post caption. #mood @james_brown https://google.com`,
				user: { connect: { id: '95786742-da41-4031-a441-71d7c9fb472e' } },
				image:
					i % 3 === 0
						? 'https://res.cloudinary.com/dogecorp/image/upload/v1632234712/sample.jpg'
						: i % 5 === 0
						? 'https://images.unsplash.com/photo-1634413656640-0bc2a33be4d1?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1228&q=80'
						: null,
			},
		})
		console.log(`Created post with id: ${post.id}`)
	}
}

async function main() {
	console.log(`Start seeding ...`)
	// await seedUsers()
	await seedPosts()
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
