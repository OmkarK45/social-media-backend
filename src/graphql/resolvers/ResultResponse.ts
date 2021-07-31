import { builder } from '../builder'

builder.queryField('health', (t) =>
	t.field({
		type: 'String',
		resolve: (_root, _args, _ctx) => {
			return 'Health OK'
		},
	})
)

interface ResultResponse {
	success: boolean
}

export const ResultResponse =
	builder.objectRef<ResultResponse>('ResultResponse')

ResultResponse.implement({
	fields: (t) => ({
		success: t.exposeBoolean('success'),
	}),
})
