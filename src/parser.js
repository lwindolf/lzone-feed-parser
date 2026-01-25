import * as a from "./autodiscover.js";

export class FeedParser {
        static maxItems = 1000;         // after how many items should we stop parsing

        static linkAutoDiscover = a.linkAutoDiscover;
        static parserAutoDiscover = a.parserAutoDiscover;
}