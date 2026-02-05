// vim: set ts=4 sw=4:

// RSS 1.1 and 2.0 parser, 0.9x is not supported
// RSS 1.0 is parsed in rdf.js

import { FeedParser } from './parser.js';
import { DateParser } from './date.js';
import { NamespaceParser } from './namespace.js'
import { XPath } from './xpath.js';
import { addMedia } from './enclosure.js';
import { safeURL } from './autodiscover.js';

class RSSParser {
    static id = 'rss';
    static autoDiscover = [
        '/rss/channel',
        '/Channel/items'
    ];

    static parseItem(node, ctxt) {
        if (ctxt.feed.newItems.length >= FeedParser.maxItems)
            return;

        let item = {
            title       : XPath.lookup(node, 'title'),
            description : XPath.lookup(node, 'description'),
            source      : safeURL(XPath.lookup(node, 'link')),
            // RSS 2.0 only
            sourceId    : XPath.lookup(node, 'guid'),
            time        : DateParser.parse(XPath.lookup(node, 'pubDate'))
        };

        XPath.foreach(node, 'enclosure', (n) => 
            addMedia(
                item,
                safeURL(XPath.lookup(n, '@url')),
                XPath.lookup(n, '@type')
            )
        );

        NamespaceParser.parseItem(ctxt.root, node, item);

        ctxt.feed.newItems.push(item);
    }

    static parse(str) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(str, 'application/xml');
        const root = NamespaceParser.getRootNode(doc);
        let feed = {
            error    : XPath.lookup(root, '/parsererror'),
            ns       : NamespaceParser.getNamespaces(root, str),
            newItems : []
        };

        // RSS 1.1
        if (root.nodeName === 'Channel') {
            feed.type        = 'rss1.1';
            feed.title       = XPath.lookup(root, '/Channel/title');
            feed.description = XPath.lookup(root, '/Channel/description');
            feed.homepage    = safeURL(XPath.lookup(root, '/Channel/link'));

            NamespaceParser.parseFeed(root, "/Channel", feed);

            XPath.foreach(root, '/Channel/items/item', this.parseItem, { root, feed });
        }

        // RSS 2.0
        if (root.nodeName === 'rss') {
            feed.type        = 'rss2.0';
            feed.title       = XPath.lookup(root, '/rss/channel/title');
            feed.description = XPath.lookup(root, '/rss/channel/description');
            feed.homepage    = safeURL(XPath.lookup(root, '/rss/channel/link'));

            NamespaceParser.parseFeed(root, "/rss/channel", feed);
            XPath.foreach(root, '/rss/channel/item', this.parseItem, { root, feed });
        }

        return feed;
    }
}

export { RSSParser };
