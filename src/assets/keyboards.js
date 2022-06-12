const { Keyboard } = require("grammy");


const Keyboards = {
    uz: {
        share_phone: new Keyboard().requestContact("Telefon raqamni jo'natish"),
        verify_order: new Keyboard().text("Bekor qilish").text("Tasdiqlash"),
        cancel_order: new Keyboard().text("Buyurtmani bekor qilish"),
        yes_no: new Keyboard().text("Yo'q").text("Ha"),
    },
    ru: {
        share_phone: new Keyboard().requestContact("Отправить номер телефона"),
        verify_order: new Keyboard().text("Отмена").text("Подтвердить"),
        cancel_order: new Keyboard().text("Отменить заказ"),
        yes_no: new Keyboard().text("Нет").text("Да"),
    }
}

module.exports = Keyboards