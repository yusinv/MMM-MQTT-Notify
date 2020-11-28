Module.register("MMM-MQTT-Notify", {

    // Default module config
    defaults: {
        mqttServers: [],
        debug: false
    },

    makeServerKey: function (server) {
        return '' + server.address + ':' + (server.port | '1883' + server.user);
    },

    start: function () {
        Log.log(this.name + ' started.');
        this.subscriptions = new Map();

        Log.log(this.name + ': Setting up connection to ' + this.config.mqttServers.length + ' servers');

        for (i = 0; i < this.config.mqttServers.length; i++) {
            let s = this.config.mqttServers[i];
            let serverKey = this.makeServerKey(s);
            Log.log(this.name + ': Adding config for ' + s.address + ' port ' + s.port + ' user ' + s.user);
            for (j = 0; j < s.subscriptions.length; j++) {
                let sub = s.subscriptions[j];
                let handler = sub.handler;
                if (handler === undefined) {
                    handler = this.defaultHandler;
                }
                Log.log(serverKey + '$$' + sub.topic);
                Log.log(handler);
                this.subscriptions.set(serverKey + '$$' + sub.topic, {
                    serverKey: serverKey,
                    notification_label: sub.notification_label,
                    topic: sub.topic,
                    handler: handler,
                });
            }
        }
        Log.log('ALL SUBSCRIPTIONS')
        this.openMqttConnection();
        const self = this;
        setInterval(function () {
            self.updateDom(1000);
        }, 5000);
    },

    defaultHandler: function (object, notification_label, value) {
        object.sendNotification(notification_label, value);
    },

    openMqttConnection: function () {
        this.sendSocketNotification('MQTT_CONFIG', this.config);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'MQTT_PAYLOAD') {
            if (payload != null) {
                Log.log(this.name + ': MQTT_PAYLOAD - ' + payload.topic + ' ' + payload.value);
                const handler_key = payload.serverKey + '$$' + payload.topic
                if (this.subscriptions.has(handler_key)) {
                    let sub = this.subscriptions.get(handler_key);
                    sub.value = payload.value;
                    sub.time = payload.time;
                    sub.handler(this, sub.notification_label, sub.value);
                }

                if (self.config.debug) {
                    this.updateDom();
                }
            } else {
                console.log(this.name + ': MQTT_PAYLOAD - No payload');
            }
        }
    },

    getDom: function () {
        const wrapper = document.createElement("table");

        if (!this.config.debug) {
            return wrapper;
        }

        // var first = true;

        if (this.subscriptions.length === 0) {
            wrapper.innerHTML = (this.loaded) ? this.translate("EMPTY") : this.translate("LOADING");
            console.log(this.name + ': No values');
            return wrapper;
        }

        this.subscriptions.forEach(function (sub) {
            let subWrapper = document.createElement("tr");

            // topic
            let topicWrapper = document.createElement("td");
            topicWrapper.innerHTML = sub.topic;
            subWrapper.appendChild(topicWrapper);

            // payload
            let payloadWrapper = document.createElement("td");
            payloadWrapper.innerHTML = sub.value;
            subWrapper.appendChild(payloadWrapper);

            // notification label
            let notifyWrapper = document.createElement("td");
            notifyWrapper.innerHTML = sub.notification_label;
            subWrapper.appendChild(notifyWrapper);

            wrapper.appendChild(subWrapper);
        });

        return wrapper;
    }
});