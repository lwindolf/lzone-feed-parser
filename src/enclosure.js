// vim: set ts=4 sw=4:

// Enclosure parser

/**
 * Add a media enclosure to the item object
 * 
 * @param {*} item      the item data
 * @param {*} url       valid URL
 * @param {*} mime      MIME type or 'audio' or 'video'
 * @param {*} length    (optional) duration in [s]
 */
export function addMedia(item, url, mime, length = NaN) {
    let l = NaN;

    try {
        l = parseInt(length, 10);
        // eslint-disable-next-line no-empty
    } catch { }

    if (!url || !mime)
        return;

    /* gravatars are often supplied as media:content with medium='image'
        so we do not treat such occurences as enclosures */
    if (-1 !== url.indexOf('www.gravatar.com'))
        return;

    /* Never add enclosures for images already contained in the description */
    if (item.description && -1 !== item.description.indexOf(url))
        return;

    if (!item.media)
        item.media = [];
    
    item.media.push({ url, mime, length: l });
}