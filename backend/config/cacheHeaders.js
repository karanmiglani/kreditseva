/** Headers that stop Hostinger CDN + browsers from serving stale HTML */
function setNoStoreHeaders(resp) {
    resp.set({
        'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'CDN-Cache-Control': 'no-store',
        'Surrogate-Control': 'no-store'
    });
}

function setStaticAssetHeaders(resp) {
    resp.set({
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store'
    });
}

module.exports = { setNoStoreHeaders, setStaticAssetHeaders };
