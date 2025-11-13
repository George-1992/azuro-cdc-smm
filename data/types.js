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
    'youtube_creator',
    'youtube_content',
    'tiktok_creator',
    'tiktok_content',
    'instagram_content',
    'instagram_creator',
    'web_page',
    'web_search',
    'pdf',
    'pdf',
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