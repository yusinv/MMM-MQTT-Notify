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
        console.log(this.name + ' started.');
        this.subscriptions = [];

        console.log(this.name + ': Setting up connection to ' + this.config.mqttServers.length + ' servers');

        for (i = 0; i < this.config.mqttServers.length; i++) {
            var s = this.config.mqttServers[i];
            var serverKey = this.makeServerKey(s);
            console.log(this.name + ': Adding config for ' + s.address + ' port ' + s.port + ' user ' + s.user);
            for (j = 0; j < s.subscriptions.length; j++) {
                var sub = s.subscriptions[j];
                this.subscriptions.push({
                    serverKey: serverKey,
                    notification_label: sub.notification_label,
                    topic: sub.topic,
                });
            }
        }

        this.openMqttConnection();
        var self = this;
        setInterval(function () {
            self.updateDom(1000);
        }, 5000);
    },

    openMqttConnection: function () {
        this.sendSocketNotification('MQTT_CONFIG', this.config);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'MQTT_PAYLOAD') {
            if (payload != null) {
                for (i = 0; i < this.subscriptions.length; i++) {
                    sub = this.subscriptions[i];
                    if (sub.serverKey === payload.serverKey && sub.topic === payload.topic) {
                        sub.value = payload.value;
                        sub.time = payload.time;
                        this.sendNotification(sub.notification_label, sub.value);
                        Log.log(this.name + ': MQTT_PAYLOAD - ' + payload.topic + ' ' + payload.value);
                    }
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

        self = this;
        var wrapper = document.createElement("table");

        if (!self.config.debug)
            return wrapper;

        var first = true;

        if (self.subscriptions.length === 0) {
            wrapper.innerHTML = (self.loaded) ? self.translate("EMPTY") : self.translate("LOADING");
            console.log(self.name + ': No values');
            return wrapper;
        }

        self.subscriptions.forEach(function (sub) {
            var subWrapper = document.createElement("tr");

            // topic
            var topicWrapper = document.createElement("td");
            topicWrapper.innerHTML = sub.topic;
            subWrapper.appendChild(topicWrapper);

            // payload
            var payloadWrapper = document.createElement("td");
            payloadWrapper.innerHTML = sub.value;
            subWrapper.appendChild(payloadWrapper);

            // notification label
            var notifyWrapper = document.createElement("td");
            notifyWrapper.innerHTML = sub.notification_label;
            subWrapper.appendChild(notifyWrapper);

            wrapper.appendChild(subWrapper);
        });

        return wrapper;
    }
});