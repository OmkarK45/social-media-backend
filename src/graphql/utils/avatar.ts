const AVATARS = [
	'https://res.cloudinary.com/dogecorp/image/upload/v1631713031/dogesocial/v1/images/12_k69qix.svg',
	'https://res.cloudinary.com/dogecorp/image/upload/v1631712848/dogesocial/v1/images/120_gdzpqn.svg',
	'https://res.cloudinary.com/dogecorp/image/upload/v1631712848/dogesocial/v1/images/10_angmg5.svg',
	'https://res.cloudinary.com/dogecorp/image/upload/v1631712848/dogesocial/v1/images/11_jbcc3z.svg',
	'https://res.cloudinary.com/dogecorp/image/upload/v1631712846/dogesocial/v1/images/3_pssn4i.svg',
	'https://res.cloudinary.com/dogecorp/image/upload/v1631712846/dogesocial/v1/images/8_ni0eag.svg',
	'https://res.cloudinary.com/dogecorp/image/upload/v1631712846/dogesocial/v1/images/5_kv1wxd.svg',
	'https://res.cloudinary.com/dogecorp/image/upload/v1631712846/dogesocial/v1/images/4_vxnd5t.svg',
	'https://res.cloudinary.com/dogecorp/image/upload/v1631712574/dogesocial/v1/images/1_oi7c6m.svg',
	'https://res.cloudinary.com/dogecorp/image/upload/v1631712846/dogesocial/v1/images/2_vvbbfo.svg',
]

export function getAvatar() {
	const index = Math.floor(Math.random() * AVATARS.length)
	return AVATARS[index]
}
