import { toDisplayStr } from "@/utils/other";
import Validators from "@/utils/validation";
import { HexagonIcon, YoutubeIcon } from "lucide-react";
import Image from "next/image";

export default function SourceTypeItem({ type, data }) {

    const options = [
        'tiktok_creator',
        'instagram_creator',
        'youtube_creator',
    ]

    const src = getTypeFromUrl(data.url);
    // console.log('src: ', src);
    let logoImgSrc = getSmUrl(src);


    return (
        <div className="flex gap-1 items-center">
            <div className="overflow-hidden">
                {/* {src === 'youtube_creator' && <YoutubeIcon className="text-red-400" />} */}
                {logoImgSrc
                    ? <Image
                        src={logoImgSrc}
                        width={25}
                        height={25}
                        alt="youtube logo"
                    />
                    : <HexagonIcon className="size-4" />
                }
            </div>
            <span>
                {toDisplayStr(src)}
            </span>
        </div>
    );
}

export const getSmUrl = (str) => {
    let logoImgSrc = '';

    try {
        if (!str) return '';

        if (str.includes('youtube') || str === 'youtube_creator') {
            logoImgSrc = '/images/other/youtube-logo.png';
        } else if (str.includes('tiktok') || str === 'tiktok_creator') {
            logoImgSrc = '/images/other/tiktok-logo.png';
        } else if (str.includes('instagram') || str === 'instagram_creator') {
            logoImgSrc = '/images/other/instagram_logo.svg';
        }
    } catch (error) {
        console.error('Error in getSmUrl:', error);
    }
    return logoImgSrc;
};

export const getTypeFromUrl = (url) => {
    try {
        if (!url) return 'n/a';

        // if it has youtube.com or youtube_creator
        if (url.includes('youtube.com') || url.includes('youtube_creator')) {
            return 'youtube_creator';
        } else if (url.includes('tiktok.com') || url.includes('tiktok_creator')) {
            return 'tiktok_creator';
        } else if (url.includes('instagram.com') || url.includes('instagram_creator')) {
            return 'instagram_creator';
        } else if (Validators.url(url)) {
            return 'website';
        }

    } catch (error) {
        console.error('Error in getTypeFromUrl:', error);
    }
    return 'n/a';
};