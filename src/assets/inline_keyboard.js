const {
    InlineKeyboard
} = require("grammy");

const { API_URL: baseUrl } = require("../config")

const InlineKeyboards = {
    select_categories: function (categories, page, pages) {
        let menu = [
            [{
                text: "◀️",
                callback_data: `prev_categories?page=${page-1}`
            },{
                text: `${page+1}/${pages}`,
                callback_data: null
            },{
                text: "▶️",
                callback_data: `next_categories?page=${page + 1}`
            }]
        ]
        // if (!categories.length) return menu
        for (const category of categories) {
            menu.unshift([{
                text: category.name,
                callback_data: `set_category?category_id=${category.id}`
            }])
        }
        return menu
    },

    menu: (notifications_count = "na") => new InlineKeyboard()
    .text("E'lonlar", "all_ads")
    .row()
    .webApp(`Bildirishnomalar ${notifications_count}`, `https://mosque-bot.vercel.app/notifications`)
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
        .text("Orqaga", `back?step=${step}`),
    ad_sections_menu: (step) =>
        new InlineKeyboard()
        .webApp("Mening e'lonlarim", `https://mosque-bot.vercel.app/announcements`)
        // .webApp("E'lon berish", "https://mosque-bot.vercel.app/add-announcement")
        .text("E'lon berish", "new_ad")
        .row()
        .text("Orqaga", `back?step=${step}`),

    yes_no: (step) => new InlineKeyboard().text("Yo'q", `no?step=${step}`).text("Ha", `yes?step=${step}`),
    back: (value) => new InlineKeyboard().text("Orqaga", `back?step=${value}`),
}

module.exports = InlineKeyboards;