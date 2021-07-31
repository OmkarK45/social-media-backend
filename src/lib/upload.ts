import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import dotEnv from 'dotenv'
// just in case
dotEnv.config()

import { config } from './config'

const { cloud_name, api_key, api_secret } = config.cloudinary

cloudinary.config({
	cloud_name,
	api_key,
	api_secret,
})

export async function upload(file: string): Promise<string> {
	try {
		const res: UploadApiResponse = await cloudinary.uploader.upload(file, {
			moderation: 'webpurify',
			folder: config.cloudinary.folder,
		})

		return res.url
	} catch (error) {
		console.log(error)
		return `Image could not be uploaded. Error : ${error.message}`
	}
}
