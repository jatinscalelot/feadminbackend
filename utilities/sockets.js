const io = require("socket.io")({
    cors : {
        origin : "*"
    }
});
const socketapi = { io: io };
module.exports.server = socketapi;
io.on("connection", function (client) {
    client.on('init', async function (data) {
        client.join(data.channelID);
    });
    client.on('join', (roomName) => {
        client.join(roomName);
        console.log(`User joined room: ${roomName}`);
    });
});
// Events endpoints
module.exports.onNewEvent = (channelID, reqData) => {
    io.emit(channelID, { event: 'onNewEvent', data : reqData });
};
module.exports.onEditEvent = (channelID, reqData) => {
    io.emit(channelID, { event: 'onEditEvent', data : reqData });
};
module.exports.onEventApproved = (channelID, reqData) => {
    io.emit(channelID, { event: 'onEventApproved', data : reqData });
};
module.exports.onEventDisapproved = (channelID, reqData) => {
    io.emit(channelID, { event: 'onEventDisapproved', data : reqData });
};
module.exports.onEventLive = (channelID, reqData) => {
    io.emit(channelID, { event: 'onEventLive', data : reqData });
};
// Shop endpoints
module.exports.onNewShop = (channelID, reqData) => {
    io.emit(channelID, { event: 'onNewShop', data : reqData });
};
module.exports.onEditShop = (channelID, reqData) => {
    io.emit(channelID, { event: 'onEditShop', data : reqData });
};
// Shop offer endpoints
module.exports.onNewShopOffer = (channelID, reqData) => {
    io.emit(channelID, { event: 'onNewShopOffer', data : reqData });
};
module.exports.onEditShopOffer = (channelID, reqData) => {
    io.emit(channelID, { event: 'onEditShopOffer', data : reqData });
};
// Online offer endpoints
module.exports.onNewOnlineOffer = (channelID, reqData) => {
    io.emit(channelID, { event: 'onNewOnlineOffer', data : reqData });
};
module.exports.onEditOnlineOffer = (channelID, reqData) => {
    io.emit(channelID, { event: 'onEditOnlineOffer', data : reqData });
};
module.exports.onOnlineOfferDisapproved = (channelID, reqData) => {
    io.emit(channelID, { event: 'onOnlineOfferDisapproved', data : reqData });
};
module.exports.onOnlineOfferApproved = (channelID, reqData) => {
    io.emit(channelID, { event: 'onOnlineOfferApproved', data : reqData });
};
// Livestream endpoints
module.exports.onNewLivestream = (channelID, reqData) => {
    io.emit(channelID, { event: 'onNewLivestream', data : reqData });
};
module.exports.onEditLivestream = (channelID, reqData) => {
    io.emit(channelID, { event: 'onEditLivestream', data : reqData });
};
// F-Coin
module.exports.onFCoinTransaction = (channelID, reqData) => {
    io.emit(channelID, { event: 'onFCoinTransaction', data : reqData });
};
// Other endpoints
module.exports.onNewChatMessage = (channelID, reqData) => {
    io.emit(channelID, { event: 'onNewChatMessage', data : reqData });
};
