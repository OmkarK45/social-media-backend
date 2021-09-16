import { NodeType, User } from '@prisma/client'
import { UploadApiResponse } from 'cloudinary'

import { builder } from '~/graphql/builder'
import { EditProfileInput } from '~/graphql/input'
import { prisma } from '~/lib/db'
import { getConnection, getPrismaPaginationArgs } from '~/lib/page'
import { upload } from '~/lib/upload'

export const UserObject = builder.objectRef<User>('User')

builder.node(UserObject, {
	isTypeOf: (value) =>
		(value as { nodeType?: NodeType }).nodeType === NodeType.User,
	id: { resolve: (user) => user.id },
	fields: (t) => ({
		bio: t.exposeString('bio', { nullable: true }),
		email: t.exposeString('email'),
		avatar: t.exposeString('avatar', { nullable: true }),
		coverImage: t.exposeString('coverImage', { nullable: true }),
		username: t.exposeString('username'),
		lastName: t.exposeString('lastName', { nullable: true }),
		firstName: t.exposeString('firstName'),
		createdAt: t.expose('createdAt', { type: 'DateTime' }),
		updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
		followers: t.connection({
			type: UserObject,
			authScopes: {
				user: true,
			},
			resolve: async (_, args, { user }) => {
				const followers = await prisma.user
					.findUnique({
						where: { email: user!.email },
						select: { hashedPassword: false },
					})
					.followers({
						...getPrismaPaginationArgs(args),
					})

				return getConnection({ args, nodes: followers })
			},
		}),
		following: t.connection({
			type: UserObject,
			authScopes: { user: true },
			resolve: async (_, args, { user }) => {
				const following = await prisma.user
					.findUnique({
						where: { email: user!.email },
						select: { hashedPassword: false },
					})
					.following({
						...getPrismaPaginationArgs(args),
					})

				return getConnection({ args, nodes: following })
			},
		}),
	}),
})

builder.queryField('me', (t) =>
	t.field({
		type: UserObject,
		authScopes: { user: true },
		resolve: async (_, _args, { user }) => {
			const me = await prisma.user.findUnique({
				where: { email: user?.email },
				rejectOnNotFound: true,
			})
			console.log(me)
			return me
		},
	})
)

builder.mutationField('editProfile', (t) =>
	t.field({
		type: UserObject,
		args: { input: t.arg({ type: EditProfileInput }) },
		authScopes: {
			user: true,
			unauthenticated: false,
		},
		resolve: async (_parent, { input }, { user }) => {
			console.log('CURRENT USER', user)
			// avatar upload + cover image upload
			let username
			let firstName

			const avatarUpload = input.avatar ? await upload(input.avatar) : null

			const coverImageUpload = input.coverImage
				? await upload(input.coverImage)
				: null

			if (input.username) {
				username = input.username
			}

			if (input.firstName) {
				firstName = input.firstName
			}

			const updatedUser = await prisma.user.update({
				where: { email: user!.email },
				data: {
					username,
					bio: input.bio,
					lastName: input.lastName,
					firstName,
					avatar: avatarUpload?.url,
					coverImage: coverImageUpload?.url,
				},
			})
			return updatedUser
		},
	})
)
