import { z } from 'zod'

import { builder } from '../builder'

export const EditProfileInput = builder.inputType('EditProfileInput', {
	fields: (t) => ({
		username: t.string({
			validate: { schema: z.string().min(3).max(15) },
		}),
		bio: t.string({ required: false }),
		lastName: t.string({ required: false }),
		firstName: t.string({ required: true }),
	}),
})
