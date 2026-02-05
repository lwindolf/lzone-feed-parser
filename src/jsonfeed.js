// vim: set ts=4 sw=4:

// https://www.jsonfeed.org/version/1.1/

import { FeedParser } from './parser.js';
import { DateParser } from './date.js';
import { addMedia } from './enclosure.js';
import { safeURL } from './autodiscover.js';

class JSONFeedParser {
    static id = 'json';

    static parseItem(i, ctxt) {
        if (ctxt.feed.newItems.length >= FeedParser.maxItems)
            return;

        let item = {
            title       : i.title,
            description : i.content_html || i.content_text || i.summary,
            time        : DateParser.parse(i.updated || i.date_published),
            sourceId    : i.id,
            source      : safeURL(i.url || i.external_url)
        };

        if (i.attachments && Array.isArray(i.attachments))
            i.attachments.forEach(n => addMedia(item, safeURL(n.url), n.mime_type));

        ctxt.feed.newItems.push(item);
    }

    static parse(str) {
        const data = JSON.parse(str);

        let feed = {
            type        : this.id,
            title       : data.title,
            icon        : data.icon || data.favicon,
            description : data.description,
            homepage    : safeURL(data.home_page_url || data.feed_url),
            newItems    : []
        };

        if (data.items && Array.isArray(data.items))
                data.items.forEach(this.parseItem, { feed });

        return feed;
    }
}

export { JSONFeedParser };
