const allTypes = {
    sources: {
        options: [
            // 'pending',
            'processing', 'processed', 'failed'
        ],
    }
}

export const webhookTypes = [
    'sources',
    'avatars',
]

export const socialMediaPlatforms = [
    'facebook',
    'youtube',
    'tiktok',
    'twitter',
    'instagram',
    'linkedin',
]

export const avatarTones = [
    'youthful',
    'professional',
    'formal',
    'poetic',
    'casual',
    'humorous',
    'enthusiastic',
    'serious',
]

export const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' }
];

export default allTypes;