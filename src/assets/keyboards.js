const { Keyboard } = require("grammy");


const Keyboards = {
    share_phone: new Keyboard().requestContact("Telefon raqamni jo'natish"),
    verify_order: new Keyboard().text("Bekor qilish").text("Tasdiqlash"),
    cancel_order: new Keyboard().text("Buyurtmani bekor qilish"),
    yes_no: new Keyboard().text("Yo'q").text("Ha"),
    select_mosque: function (mosques) {
        let menu = []
        for (let mosque = 0; mosque <= mosques.length; mosque+=2) {
            menu.push(mosques[mosque+1] ? [{
                text: mosques[mosque].name
            },{
                text: mosques[mosque+1].name
            }] : [{
                text: mosques[mosque].name
            }])
        }
        return menu
    },
}

module.exports = Keyboards