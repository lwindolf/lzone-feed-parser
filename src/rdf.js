// vim: set ts=4 sw=4:

// RSS 1.0 parser

import { FeedParser } from './parser.js';
import { NamespaceParser } from './namespace.js'
import { XPath } from './xpath.js';

class RDFParser {
	static id = 'rss1.0';
	static autoDiscover = [
		'/rdf:RDF/ns:channel'
	];

	static parseItem(node, ctxt) {
		if (ctxt.feed.itemCount >= FeedParser.maxItems)
			return;

		let item = {
			title       : XPath.lookup(node, 'ns:title'),
			description : XPath.lookup(node, 'ns:description'),
			source      : XPath.lookup(node, 'ns:link'),
		};

		NamespaceParser.parseItem(ctxt.root, node, item);

		ctxt.feed.newItems.push(item);
	}

	static parse(str) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(str, 'application/xml');
		const root = NamespaceParser.getRootNode(doc);
		let feed = {
			error    : XPath.lookup(root, '/parsererror'),
			newItems : []
		};

		// RSS 1.0
		if (doc.firstChild.nodeName === 'rdf:RDF') {
			feed.type        = this.id,
			feed.ns          = NamespaceParser.getNamespaces(root, str);
			feed.title       = XPath.lookup(root, '/rdf:RDF/ns:channel/ns:title');
			feed.description = XPath.lookup(root, '/rdf:RDF/ns:channel/ns:description');
			feed.homepage    = XPath.lookup(root, '/rdf:RDF/ns:channel/ns:link');

			XPath.foreach(root, '/rdf:RDF/ns:item', this.parseItem, { root, feed });
		}

		return feed;
	}
}

export { RDFParser };
