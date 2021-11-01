import { PrismaClient, Prisma } from '@prisma/client'
import { generateCoverImage } from '../src/graphql/utils/generateCoverImage'
import { getAvatar, getCoverImages } from '../src/graphql/utils/avatar'
import { hashPassword } from '../src/lib/password'
import { userIds } from './userData'

const prisma = new PrismaClient()

async function getPwd() {
	return await hashPassword('123456')
}

const userData = [...Array(25).keys()].slice(1)
const postData = [...Array(25).keys()].slice(1)

async function seedUsers() {
	for (const [u, i] of userData.entries()) {
		const user = await prisma.user.create({
			data: {
				email: `demo_account${(u + 1) * 100}@gmail.com`,
				username: `demo_account_${(u + 1) * 100}`,
				firstName: `demo_firstName_${u}`,
				hashedPassword: await getPwd(),
				bio: `Hello my name is demo_account_${u}. Have a good day`,
				following: {
					connect: {
						username: 'james_brown',
					},
				},
				avatar: getAvatar(),
				coverImage: generateCoverImage().coverImage,
				coverImageBg: generateCoverImage().coverImageBg,
			},
		})
		console.log(`Created user with id: ${user.id}`)
	}
}

async function seedPosts() {
	for (const [p, i] of postData.entries()) {
		const post = await prisma.post.create({
			data: {
				caption: `[${
					i + 9
				}] Example post caption. This is a nice post by someone.`,
				user: {
					connect: { id: userIds[Math.floor(Math.random() * userIds.length)] },
				},
				image:
					i % 3 === 0
						? 'https://res.cloudinary.com/dogecorp/image/upload/v1632234712/sample.jpg'
						: i % 5 === 0
						? 'https://images.unsplash.com/photo-1635371854719-bcb6871917f2?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1170&q=80'
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
