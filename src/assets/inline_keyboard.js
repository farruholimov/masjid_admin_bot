const {
    InlineKeyboard
} = require("grammy");

const { API_URL: baseUrl } = require("../config")

const InlineKeyboards = {
    select_categories: function (categories, action) {
        let menu = [
            [{
                text: "Davom etish",
                callback_data: `end_category`
            }]
        ]
        if (action == "remove_category") {
            menu = [
                [{
                    text: "Orqaga",
                    callback_data: `back?step=settings`
                }]
            ]
        }
        // if (!categories.length) return menu
        for (const category of categories) {
            menu.unshift([{
                text: category.name,
                callback_data: `${action}?category_id=${category.id}`
            }])
        }
        return menu
    },

    menu: new InlineKeyboard()
        .text("Masjidlar", `${baseUrl}/static/mosques.html`)
        .row()
        .text("Extiyojlar", "all_needs")
        .text("Sozlamalar", "settings"),
    admin_menu: new InlineKeyboard()
        .text("Masjidlar", "all_mosques")
        .row()
        .text("E'lonlar", "all_ads")
        .text("Sozlamalar", "settings"),

    menu_switch: (offset, step) => new InlineKeyboard()
        .text("◀️", `prev?offset=${Number(offset) - 1}`)
        .text("▶️", `next?offset=${Number(offset) + 1}`)
        .row()
        .text("Orqaga", `back?step=${step}`),

    user_info_menu: (step) =>
        new InlineKeyboard()
        .text("Ismni o'zgartirish", `change_user_info?step=name`)
        .text("Raqamni o'zgartirish", `change_user_info?step=phone`)
        .row()
        .text("Tanlangan kategoriyalar", `my_categories`)
        .row()
        .text("Orqaga", `back?step=${step}`),
    order_sections_menu: (step) =>
        new InlineKeyboard()
        .text("Barchasi", `all_orders`)
        .text("Hozirgi", `current_order`)
        .row()
        .text("Orqaga", `back?step=${step}`),

    back: (value) => new InlineKeyboard().text("Orqaga", `back?step=${value}`),
}

module.exports = InlineKeyboards;