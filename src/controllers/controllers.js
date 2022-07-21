const InlineKeyboards = require("../assets/inline_keyboard")
const Keyboards = require("../assets/keyboards")
const messages = require("../assets/messages")
const {
    validURL
} = require("../modules/regex_url")
const fetchUrl = require("../modules/fetch_url")

class Controllers {

    static async updateUserStep(ctx, step) {
        try {
            await fetchUrl(`/users/${ctx.msg.chat.id}`, "PUT", {adstep: step})
        } catch (error) {
            console.log(error);
        }
    }

    static async getUser(ctx) {
        try {
            let user = await fetchUrl(`/users/tg/${ctx.msg.chat.id}`)
            if (!user.ok) {
                return false
            }
            return user.data.user
        } catch (error) {
            console.log(error);
        }
    }

    static async sendAlert(ctx, text) {
        await ctx.reply(text, {
            parse_mode: "HTML"
        })
    }

    static async changeCredentials(ctx) {
        try {
            const {
                query
            } = require("query-string").parseUrl(ctx.callbackQuery.data)

            switch (query.step) {
                case "name":
                    await editMessage(
                        ctx, ctx.callbackQuery.message.message_id,
                        "text", messages.inputNameMsg, {
                            inline_keyboard: []
                        }
                    )
                    break;
                case "phone":
                    await editMessage(
                        ctx, ctx.callbackQuery.message.message_id,
                        "text", messages.telMsg, {
                            inline_keyboard: []
                        }
                    )
                    break;
                case "lang":
                    await editMessage(
                        ctx, ctx.callbackQuery.message.message_id,
                        "text", messages.startMsg, {
                            inline_keyboard: InlineKeyboards.select_language.inline_keyboard
                        }
                    )
                    break;

                default:
                    break;
            }

            ctx.session.step = `edit_user_info:${query.step}`
            await Controllers.updateUserStep(ctx, ctx.session.step)

            await ctx.answerCallbackQuery()

        } catch (error) {
            console.log(error);
        }
    }

    // NAME

    static async askName(ctx) {
        await ctx.reply(messages.nameMsg, {
            parse_mode: "HTML"
        })
    }

    static async setName(ctx) {

        try {
            ctx.session.user.name = ctx.msg.text
            console.log(ctx.session);
            let user = await fetchUrl(`/users/${ctx.msg.chat.id}`, "PUT", {full_name: ctx.msg.text})
            console.log(user);
        } catch (error) {
            console.log(error);
        }
    }

    // PHONE

    static async askPhone(ctx) {

        let x = await ctx.reply(messages.telMsg, {
            parse_mode: "HTML",
            // reply_markup: {
            //     resize_keyboard: true,
            //     keyboard: Keyboards.share_phone.build()
            // }
        })

    }

    static async setPhone(ctx) {

        try {

            if (ctx.msg.text && !(/^\+\998[389][012345789][0-9]{7}$/).test(ctx.msg.text)) {
                let x = await ctx.reply(messages.invalidNumberMsg, {
                    parse_mode: "HTML",
                })
                // ctx.session.messages_to_delete.push(ctx.message.message_id)
                // ctx.session.messages_to_delete.push(x.message_id)
                return false
            }

            ctx.session.user.phone = ctx.msg.contact ? ctx.msg.contact.phone_number : ctx.msg.text

            let user = await fetchUrl(`/users/${ctx.msg.chat.id}`, "PUT", {phone_number: ctx.msg.text})
            return user?.ok
        } catch (error) {
            console.log(error);
        }

    }

    static async askUsername(ctx) {
        await ctx.reply(messages.loginMsg, {
            parse_mode: "HTML"
        })
    }

    static async askPassword(ctx) {
        await ctx.reply(messages.pswdMsg, {
            parse_mode: "HTML"
        })
    }

    
    static async Login(ctx) {
        try {
            ctx.session.password = ctx.msg.text
            console.log(ctx.session.username, ctx.session.password);
            let user = await fetchUrl(`/users/tg/login`, "POST", {telegram_id: ctx.msg.chat.id, username: ctx.session.username, password: ctx.session.password})
            let text = "Xatolik yuz berdi"
            switch (user?.message) {
                case "Mosque not found!":
                    text = "Masjid topilmadi!"
                    break;
                case "Incorrect username or password!":
                    text = "Ma'lumotlar mos kelmadi!"
                    break
                case "Not mosque admin!":
                    text = "Siz bu masjidga admin emassiz!"
                    break
                default:
                    break;
            }

            if (!user.ok) {
                await ctx.reply(text, {
                    parse_mode: "HTML"
                })
                return false
            }
            return user?.ok
        } catch (error) {
            console.log(error);
        }

    }

    // -- END REGISTER --

    // MENU

    static async sendMenu(ctx, additional) {
        const user = await this.getUser(ctx) 
        const notification_count = await fetchUrl(`/notifications?user_id=${user.id}&count=true`)
        await ctx.reply((additional ? additional + "\n" : '') + messages.menuMsg, {
            parse_mode: "HTML",
            reply_markup: InlineKeyboards.menu(String(notification_count.data.count))
        })
    }

    static async openSettingsMenu(ctx) {

        let user = await Controllers.getUser(ctx)

        await ctx.editMessageText(
            `Profil:\n\n<i>Ismingiz:</i>  <b>${user.full_name}</b>
            \n<i>Telefon raqamingiz:</i>  <b>${user.phone_number}</b>`, {
                parse_mode: "HTML",
                message_id: ctx.callbackQuery.message.message_id,
                reply_markup: InlineKeyboards.user_info_menu("menu")
            })

        await ctx.answerCallbackQuery()
    }

    static async backToMenu(ctx) {
        const {
            query
        } = require("query-string").parseUrl(ctx.callbackQuery.data)
        switch (query.step) {
            case "menu":
                await ctx.editMessageText(messages.menuMsg, {
                    parse_mode: "HTML",
                    message_id: ctx.callbackQuery.message.message_id,
                    reply_markup: InlineKeyboards.menu
                })
                break;
        
            case "settings":
                Controllers.openSettingsMenu(ctx)
                break;
        
            default:
                break;
        }

        await ctx.answerCallbackQuery()
    }

    // Ad

    static async askAdName(ctx) {
        await ctx.reply("E'lon sarlavhasini kiriting:\n (Sarlavhada batafsil ma'lumot va miqdor ko'rsatilishi shart emas)", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: Keyboards.verify_order.build(),
                resize_keyboard: true,
            }
        })
        await ctx.answerCallbackQuery()
    }

    static async setAdName(ctx) {
        ctx.session.ad.name = ctx.msg.text
    }

    static async askAdAmount(ctx) {
        await ctx.reply("Kerakli miqdorni kiriting:", {
            parse_mode: "HTML"
        })
    }

    static async setAdAmount(ctx) {
        if (isNaN(ctx.msg.text)) {
            let m = await ctx.reply("Iltimos, miqdor sifatida son jo'nating!")
            ctx.session.messages_to_delete.push(m.message_id)
            ctx.session.messages_to_delete.push(ctx.msg.message_id)
            return false
        }
        ctx.session.ad.amount = ctx.msg.text
    }

    static async askAdAmountType(ctx) {
        await ctx.reply("Miqdor birligini tanlang yoki kiriting:", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: Keyboards.amount_types.build(),
                resize_keyboard: true,
            }
        })
    }

    static async setAdAmountType(ctx) {
        ctx.session.ad.amount_type = ctx.msg.text
    }

    static async askAdText(ctx) {
        await ctx.reply("Qo'shimcha izoh qoldirasizmi?", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: Keyboards.verify_order.build(),
            }
        })
        await ctx.deleteMessage()
        await ctx.reply("Qo'shimcha izoh qoldirasizmi?", {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: InlineKeyboards.yes_no("ad:text"),
            }
        })
    }

    static async setAdText(ctx) {
        ctx.session.ad.text = ctx.msg.text
    }

    static async sendCategories(ctx, page, action){
        try {
            const categories = await fetchUrl(`/categories/tg${page ? `?page=${page}` : ""}`)
            action == "edit" ?
            await ctx.editMessage("Kerakli bo'limni tanlang:", {
                message_id: ctx.callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: InlineKeyboards.select_categories(categories.data.categories, categories.data.pagination.current, categories.data.pagination.pages)
                }
            })
            : await ctx.reply("Kerakli bo'limni tanlang:", {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: InlineKeyboards.select_categories(categories.data.categories, categories.data.pagination.current, categories.data.pagination.pages)
                }
            });
        } catch (error) {
            console.log(error);
        }
    }
}

async function editMessage(ctx, message_id, message_type, text, reply_markup) {
    if (message_type == "text") {
        await ctx.editMessageText(text, {
            message_id: message_id,
            parse_mode: "HTML",
            reply_markup: reply_markup
        })
    } else if (message_type == "photo") {
        await ctx.api.editMessageCaption(ctx.msg.chat.id, message_id, {
            caption: text,
            parse_mode: "HTML",
            reply_markup: reply_markup
        })
    }
}

async function cleanMessages(ctx) {
    for (let msg of ctx.session.messages_to_delete) {
        await ctx.api.deleteMessage(ctx.msg.chat.id, msg)
    }

    ctx.session.messages_to_delete = []
}

async function filterCategories(ctx){
    let noctgs = []

    const user = await Controllers.getUser(ctx)

    let uctgs = await fetchUrl(`/categories/user/${user.id}`)
    uctgs = uctgs.data ? uctgs.data.user_categories : []

    let ctgs = await fetchUrl(`/categories/tg`)
    ctgs = ctgs.data ? ctgs.data.categories : []

    console.log(ctgs, uctgs);

    let arr1 = []
    let arr2 = []

    for (const ctg of ctgs) {
        arr1.push(ctg.id)
    }
    for (const uctg of uctgs) {
        arr2.push(uctg.id)
    }
    
    let nonexists = arr1.filter(c => !arr2.includes(c))
    
    for (const c of nonexists) {
        let ct = await fetchUrl(`/categories/tg/${c}`)
        noctgs.push(ct.data.category)
    }
    return noctgs
}

module.exports = Controllers