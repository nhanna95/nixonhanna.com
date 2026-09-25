import { parse } from 'yaml';
import tagDescriptionsRaw from '../data/tag_descriptions.yml?raw';

// _data/tag_descriptions.yml equivalent.
export function getTagDescriptions(): Record<string, string> {
    return parse(tagDescriptionsRaw) as Record<string, string>;
}
