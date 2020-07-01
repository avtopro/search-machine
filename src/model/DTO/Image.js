export default class Image {
    constructor(src) {
        this.uri = src && src.ImageUri;
        this.thumbnailUri = src && src.ThumbnailUri;
    }

    toString() {
        return this.thumbnailUri || '';
    }

    static parseFromString(src) {
        return src ? new Image({ ImageUri: src, ThumbnailUri: src }) : null;
    }
}
