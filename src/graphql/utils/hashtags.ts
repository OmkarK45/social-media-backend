export interface HashTag {
	where: {
		hashtag: string
	}
	create: {
		hashtag: string
	}
}

export function parseHashtags(caption: string): Array<HashTag> {
	const hashtags = caption.match(/#[\w]+/g) || []
	return hashtags.map((hashtag) => ({
		where: { hashtag },
		create: { hashtag },
	}))
}
