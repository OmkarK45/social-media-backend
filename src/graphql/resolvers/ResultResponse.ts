import { builder } from '../builder'

builder.queryField('health', (t) =>
	t.field({
		type: 'String',
		resolve: (_root, _args, _ctx) => {
			return 'Health OK'
		},
	})
)
// todo => include a message field to show toast mesage on fronend for consistency
export const ResultResponse = builder.simpleObject('ResultResponse', {
	fields: (t) => ({
		success: t.boolean(),
	}),
})
