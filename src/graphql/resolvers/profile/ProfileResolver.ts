import { builder } from '../../builder'
import { UserObject } from '../user/UserResolver'

const ProfileResponse = builder.simpleObject('ProfileResponse', {
	fields: (t) => ({
		user: t.field({ type: UserObject }),
	}),
})

builder.queryField('seeProfile', (t) =>
	t.field({
		type: ProfileResponse,
		args: { username: t.arg.string() },
		authScopes: { user: true },
		resolve: async (_root, { username }, { user, prisma }) => {
			// @ Future -> check if profile is public or private
			const profile = await prisma.user.findUnique({
				where: {
					username,
				},
				rejectOnNotFound: true,
			})
			return { user: profile }
		},
	})
)