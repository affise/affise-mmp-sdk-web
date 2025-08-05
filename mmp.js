(function (global) {
    const STORAGE_KEY = 'affise_sdk_storage';

    function generateUUID() {
        return URL.createObjectURL(new Blob()).split('/').pop();
    }

    function getUTCTimestamp() {
        return new Date().getTime();
    }

    function loadDeviceData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return JSON.parse(data);

        const deviceData = {
            affise_device_id: generateUUID(),
            random_user_id: generateUUID(),
            first_open_time: getUTCTimestamp()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deviceData));
        return deviceData;
    }

    class AffiseMMP {
        constructor() {
            this.initialized = false;
            this.config = {};
            this.deviceData = loadDeviceData();
        }

        init(config) {
            const required = ['affise_app_id', 'affise_pkg_app_name', 'affise_app_token'];
            for (const key of required) {
                if (!config[key]) throw new Error(`Missing config param: ${key}`);
            }
            this.config = config;
            this.initialized = true;
        }

        sendEvents(events) {
            if (!this.initialized) {
                console.error('AffiseMMP not initialized.');
                return;
            }
            this.sendPostback(events)
        }

        sendPostback(events = []) {
            if (!this.initialized) {
                console.error('AffiseMMP not initialized.');
                return;
            }

            if (!Array.isArray(events) || events.length === 0) {
                console.error('No events to send.');
            }

            const payload = {
                uuid: generateUUID(),
                created_time: getUTCTimestamp(),
                affise_app_id: this.config.affise_app_id,
                affise_pkg_app_name: this.config.affise_pkg_app_name,
                affise_app_token: this.config.affise_app_token,
                affise_device_id: this.deviceData.affise_device_id,
                random_user_id: this.deviceData.random_user_id,
                first_open_time: this.deviceData.first_open_time,
                platform: 'web',
                events
            };

            fetch('https://tracking.affattr.com/postback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([payload])
            })
                .then((response) => {
                    if (!response.ok) throw new Error(`Server error: ${response.status}`);
                    return response.json();
                })
                .then((data) => {
                    console.log('Postback sent successfully', data);
                })
                .catch((err) => {
                    console.error('Failed to send postback', err);
                });
            }
    }

    global.AffiseMMP = new AffiseMMP();
})(window);
