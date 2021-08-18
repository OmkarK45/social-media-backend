import { resolveArrayConnection } from '@giraphql/plugin-relay'
import { Post } from '@prisma/client'
import { builder } from '~/graphql/builder'
import { connectionForPrisma, resolveConnection } from '~/lib/cursor'
import { prisma } from '~/lib/db'
import { UserObject } from '../user/UserResolver'

// Look into this FeedPosts -> Post
const FeedResponse = builder.objectRef<Post>('FeedPosts')

FeedResponse.implement({
	fields: (t) => ({
		id: t.exposeString('id'),
		image: t.exposeString('image', { nullable: true }),
		caption: t.exposeString('caption', { nullable: true }),
		// probably a good idea would be to remove emails from here
		user: t.field({
			type: UserObject,
			resolve: async (post, _args, _ctx) => {
				return await prisma.user.findUnique({
					where: { id: post.userId },
					rejectOnNotFound: true,
				})
			},
		}),
	}),
})

builder.queryField('feed', (t) =>
	t.field({
		type: [FeedResponse],
		args: {
			before: t.arg.string({}),
			after: t.arg.string(),
			offset: t.arg.int(),
		},
		authScopes: { user: true },
		resolve: async (_parent, args, { user }) => {
			const users = await prisma.post.findMany({
				where: {
					OR: [
						{ user: { followers: { some: { id: user!.id } } } },
						{ userId: user?.id },
					],
				},
				...connectionForPrisma(args, 'createdAt'),
			})
			console.log(
				JSON.stringify(
					resolveArrayConnection(
						{
							args,
						},
						users
					),
					null,
					2
				)
			)
			resolveArrayConnection({ args }, users)
			return users
		},
	})
)
