import { parse } from 'yaml';
import mediaLogRaw from '../data/media_log.yml?raw';
import tagDescriptionsRaw from '../data/tag_descriptions.yml?raw';

export interface MediaItem {
    date_added: string;
    type: string;
    url: string;
    title: string;
    blurb?: string;
}

// _data/media_log.yml equivalent, sorted by date_added newest-first
// (Jekyll: sort: 'date_added' | reverse).
export function getMediaLog(): MediaItem[] {
    const items = parse(mediaLogRaw) as MediaItem[];
    return items
        .sort((a, b) => a.date_added.localeCompare(b.date_added))
        .reverse();
}

// _data/tag_descriptions.yml equivalent.
export function getTagDescriptions(): Record<string, string> {
    return parse(tagDescriptionsRaw) as Record<string, string>;
}
