# lzone-feed-parser

Simple JS ESM module for feed parsing. Aims to have feature parity with [Liferea](https://github.com/windolf/liferea) feed reader.

This lib is used by:

- [rss-feed-index](https://github.com/lwindolf/rss-feed-index)
- [rss-finder](https://github.com/lwindolf/rss-finder)
- [lzone.de](https://github.com/lwindolf/lzone.de)
- [SaaS Multi Status](https://github.com/lwindolf/multi-status)

## Setup

    npm i
    npm test

## Usage in browser

    import { FeedParser } from './lzone-feed-parser/src/parser.js';

    // Autodiscover feed links 
    const weburl = 'https://example.com/feed';
    const html = await fetch(weburl);
    const links = FeedParser.linkAutoDiscover(html, weburl);

    // Fetch and parse feed
    const str = await fetch('https://example.com/feed');
    const parser = FeedParser.parserAutoDiscover(str);
    const feed = parser.parse(str);

## Usage in Node.js

To use the library in Node.js you can use the JSDOM library

    npm install jsdom

and provide a browser-like environment like this:

    import { JSDOM } from 'jsdom';

    // window as global for ESM browser modules
    globalThis.window = globalThis;
    
    // feed-parser requires DOMParser in window
    const jsdom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
    globalThis.window = jsdom.window;
    globalThis.document = jsdom.window.document;
    globalThis.DOMParser = jsdom.window.DOMParser;
