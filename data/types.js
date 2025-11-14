const allTypes = {
    sources: {
        options: [
            // 'pending',
            'draft',
            'ready', 'scheduled',
            'cancelled', 'published',
            // 'processing', 'processed', 'failed'
        ],
    }
}

export const sourceTypes = [
    'web_page',
    'web_search',
    'pdf',
    'raw_text',
    'youtube_content',
    'youtube_creator',
    'tiktok_content',
    'tiktok_creator',
    'instagram_content',
    'instagram_creator'
]

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

export const weekdayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
];

export const contentTypeOptions = [
    { value: 'video', label: 'Video' },
    { value: 'post', label: 'Post' },
];


export default allTypes;