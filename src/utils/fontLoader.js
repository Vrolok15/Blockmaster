export function loadFonts() {
    return new Promise((resolve, reject) => {
        // Check if WebFont is already loaded
        if (window.WebFont) {
            window.WebFont.load({
                google: {
                    families: ['Silkscreen']
                },
                active: resolve,
                inactive: reject
            });
        } else {
            // Load WebFont script first
            const script = document.createElement('script');
            script.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
            script.async = true;
            script.onload = () => {
                window.WebFont.load({
                    google: {
                        families: ['Silkscreen']
                    },
                    active: resolve,
                    inactive: reject
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        }
    });
} 