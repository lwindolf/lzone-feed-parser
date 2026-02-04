// vim: set ts=4 sw=4:

// Feed Autodiscovery
//
// 1.) link discovery in HTML documents
// 2.) type discovery in feed documents (parser factory)

import { XPath } from './xpath.js';
import { AtomParser } from './atom.js';
import { RSSParser } from './rss.js';
import { RDFParser } from './rdf.js';
import { JSONFeedParser } from './jsonfeed.js';
import { NamespaceParser } from './namespace.js';

const MAX_LINKS_TO_PROCESS = 100;

// Return a parser class matching the given document string or undefined
function parserAutoDiscover(str) {
    if (!str || typeof str !== 'string')
        return undefined;
    
    if (str.startsWith('{')) {
        try {
            const obj = JSON.parse(str);
            if (obj.version && obj.version.startsWith("https://jsonfeed.org/version/"))
                return JSONFeedParser;
        } catch (e) {
            console.log('autodiscover Failed to parse JSON feed:', e);
        }
    }

    let parsers = [AtomParser, RSSParser, RDFParser];
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'application/xml');
    let root = NamespaceParser.getRootNode(doc);

    for (let i = 0; i < parsers.length; i++) {
        for (let j = 0; j < parsers[i].autoDiscover.length; j++) {
            try {
                if (XPath.lookup(root, parsers[i].autoDiscover[j]))
                    return parsers[i];
            } catch (e) {
                // eslint-disable-next-line no-unused-vars
            }
        }
    }
    return undefined;
}

// for a given HTML document link return the first found rel="blogroll" link
function opmlAutoDiscover(str, baseURL) {
    let doc, result = null;

    // Try to parse as HTML
    try {
        doc = new window.DOMParser().parseFromString(str, 'text/html');
    } catch {
        console.info("autodiscover could not parse HTML for links!");
    }

    // Try DOM based extraction (this fails on unclosed <link> tags)
    if (doc) {
        const n = doc.head.querySelector('link[rel="blogroll"]');
        if (n)
            result = n.getAttribute('href');
    }

    // Fuzzy extract link tag from HTML string
    if (!result) {
        const linkPattern = /<link[^>]*>/g;
        const hrefPattern = /href="([^"]*)"/;
        const relPattern = /rel=["']blogroll["']/;

        let max = MAX_LINKS_TO_PROCESS; // avoid processing an excessive amount of links
        let match;
        while (max && (match = linkPattern.exec(str)) !== null) {
            const relMatch = relPattern.exec(match[0]);
            const hrefMatch = hrefPattern.exec(match[0]);
            const url = hrefMatch ? hrefMatch[1] : null;

            if (url && relMatch) {
                result = url;
                break;
            }
            max--;
        }
    }

    return safeURL(result, baseURL);
}

const FEED_TYPES = [
    'application/atom+xml',
    'application/rss+xml',
    'application/rdf+xml',
    'application/json',
    'text/xml'
];

function isFeedType(type) {
    return FEED_TYPES.includes(type);
}

// for a given HTML document link return all feed links found
function linkAutoDiscover(str, baseURL) {
    let doc;

    // Try to parse as HTML
    try {
        doc = new DOMParser().parseFromString(str, 'text/html');
    } catch {
        console.info("autodiscover could not parse HTML for links!");
    }

    if (!doc)
        return [];

    let results = [];

    // Try DOM based extraction (this fails on unclosed <link> tags)
    doc.head.querySelectorAll('link[rel="alternate"]').forEach((n) => {
        const type = n.getAttribute('type');
        if (type && isFeedType(type))
            results.push(n.getAttribute('href'));
    });

    // Fuzzy extract link tags from HTML string
    if (results.length === 0) {
        const linkPattern = /<link[^>]*>/g;
        const hrefPattern = /href="([^"]*)"/;
        const relPattern = /rel=["']alternate["']/;
        const typePattern = /type=["']([^"']+)["']/;

        let max = MAX_LINKS_TO_PROCESS; // avoid processing an excessive amount of links
        let match;
        while (max && (match = linkPattern.exec(str)) !== null) {
            const relMatch = relPattern.exec(match[0]);
            const hrefMatch = hrefPattern.exec(match[0]);
            const typeMatch = typePattern.exec(match[0]);
            const type = typeMatch ? typeMatch[1] : null;
            const url = hrefMatch ? hrefMatch[1] : null;

            if (url && type && relMatch && isFeedType(type))
                results.push(url);
            max--;
        }
    }

    // Ensure URLs are safe, absolute, non undefined and unique
    results = [...new Set(results.map((href) => safeURL(href, baseURL)).filter(Boolean))];

    return results;
}

// ensure safe URL handling
//
// @href    unsafe relative or absolute URL
// @baseURL safe base URL string (or undefined)
function safeURL(href, baseURL) {
    if (!href)
        return undefined;

    try {
        const u = new URL(href, baseURL);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
            return undefined;
        }
        return u.href;
    } catch {
        return undefined;
    }
}

export { parserAutoDiscover, linkAutoDiscover, opmlAutoDiscover, safeURL };
