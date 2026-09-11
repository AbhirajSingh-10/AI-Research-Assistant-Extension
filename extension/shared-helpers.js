(function (global) {
    const helpers = {
        extractYoutubeVideoId(url) {
            if (typeof url !== 'string') {
                return null;
            }

            const trimmed = url.trim();

            if (!trimmed) {
                return null;
            }

            const directVideoId = trimmed.match(/(?:^|[/?=&])([A-Za-z0-9_-]{11})(?:[/?&]|$)/);

            if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
                return trimmed;
            }

            if (directVideoId && directVideoId[1]) {
                return directVideoId[1];
            }

            let urlToParse = trimmed;

            if (!/^https?:\/\//i.test(urlToParse)) {
                urlToParse = `https://${urlToParse}`;
            }

            try {
                const parsedUrl = new URL(urlToParse);
                const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');

                if (
                    hostname === 'youtube.com' ||
                    hostname === 'm.youtube.com' ||
                    hostname === 'music.youtube.com' ||
                    hostname === 'youtube-nocookie.com'
                ) {
                    const videoId = parsedUrl.searchParams.get('v');

                    if (videoId) {
                        return videoId;
                    }

                    const shortMatch = parsedUrl.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?]+)/i);

                    if (shortMatch && shortMatch[1]) {
                        return shortMatch[1];
                    }

                    return null;
                }

                if (hostname === 'youtu.be') {
                    const pathId = parsedUrl.pathname.replace(/^\//, '').split('/')[0];
                    return pathId || null;
                }

                return null;
            } catch (error) {
                return null;
            }
        },

        canonicalizeYoutubeUrl(url) {
            const videoId = helpers.extractYoutubeVideoId(url);

            if (!videoId) {
                return typeof url === 'string' ? url.trim() : '';
            }

            return `https://www.youtube.com/watch?v=${videoId}`;
        },

        getApiBaseUrl() {
            const customBaseUrl = localStorage.getItem('researchApiBaseUrl');

            if (customBaseUrl && customBaseUrl.trim()) {
                return customBaseUrl.trim().replace(/\/+$/, '');
            }

            return 'http://localhost:8080';
        },

        getApiErrorMessage(error, fallbackMessage) {
            const message = error && error.message ? error.message.toLowerCase() : '';

            if (
                message.includes('failed to fetch') ||
                message.includes('network') ||
                message.includes('load failed') ||
                message.includes('connect') ||
                message.includes('timeout')
            ) {
                return 'The research backend is unavailable or not running. Please start the local service and try again.';
            }

            return fallbackMessage || 'Something went wrong.';
        },

        async copyText(value) {
            if (typeof value !== 'string') {
                throw new Error('Nothing to copy.');
            }

            if (!value.trim()) {
                throw new Error('Nothing to copy.');
            }

            if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(value);
                return true;
            }

            const textArea = document.createElement('textarea');
            textArea.value = value;
            textArea.setAttribute('readonly', '');
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                const isCopied = document.execCommand('copy');
                return isCopied;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    };

    global.ResearchHelpers = helpers;
}(typeof window !== 'undefined' ? window : globalThis));
