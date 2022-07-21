const {
    Bot,
    session,
    GrammyError,
    BotError,
    HttpError
} = require("grammy");
const configs = require("./src/config");
const { askName, askPhone, setName, updateUserStep, sendMenu, setPhone, openSettingsMenu, backToMenu, getUser, sendAlert, changeCredentials, Login, askUsername, askPassword, askAdName, setAdName, setAdAmount, askAdAmount, askAdAmountType, setAdAmountType, setAdText, sendCategories, askAdText, sendResult, createAd } = require("./src/controllers/controllers");
const { Router } = require("@grammyjs/router");
const messages = require("./src/assets/messages");
const InlineKeyboards = require("./src/assets/inline_keyboard");
const fetchUrl = require("./src/modules/fetch_url");
const Keyboards = require("./src/assets/keyboards");


const bot = new Bot(configs.TG_TOKEN)

bot.use(session({
    initial: () => ({
        step: "idle",
        login: false, 
        user: {
            id: null,
            tgid: null,
            name: null,
            phone: null,
        },
        ad: {
            name: null,
            category_id: null,
            text: null,
            amount: null,
            amount_type: null,
        },
        editing: false,
        messages_to_delete: []
    })
}))

bot.api.setMyCommands([
    {
        command: "start",
        description: "Botni (qayta) ishga tushurish"
    },
    {
        command: "menu",
        description: "Asosiy menyu"
    },
    {
        command: "logout",
        description: "Chiqish / Sessiyani tugatish"
    },
]);

bot.command("start", async (ctx, next) => {
    const chat_id = ctx.msg.chat.id
    let user = await getUser(ctx)
    
    if(user && user.mosque_admin){
        if (user.mosque_admin.verified == false) {
            await sendAlert(ctx, "Siz hali tasdiqlanmagansiz")
            return
        }
    }

    if (!user) {
        let body = {
            telegram_id: chat_id,
            role: 2,
            adstep: "name"
        }
        user = await fetchUrl(`/users`, "POST", body)
        user = user?.data.user
        // user = await fetchUrl(`/users/mosque-admin`, "POST", {user_id: user.id})

        ctx.session.user.tgid = chat_id
        ctx.session.user.id = user.id
        ctx.session.step = "name"
        await askName(ctx)
        return
    }

    ctx.session.user = {
        tgid: chat_id,
        id: user.id,
        name: user.full_name,
        phone: user.phone_number,
    }

    ctx.session.step = user.adstep

    if (!ctx.session.login) {
        ctx.session.step = "username"
        await updateUserStep(ctx, "username")
        await askUsername(ctx)
        return
    }
    else if (ctx.session.step == "menu") {
        await sendMenu(ctx)
        return
    }
    else if(ctx.session.step == "username" || ctx.session.step == "idle" || ctx.session.step == "password"){
        ctx.session.step = "username"
        await updateUserStep(ctx, "username")
        await askUsername(ctx)
        return
    }
})

bot.on("message", async (ctx, next) => {
    const chat_id = ctx.msg.chat.id

    if (!ctx.session.login && ctx.session.step != "username" && ctx.session.step != "password") {
        await ctx.reply("Sessiyangiz eskirgan. Login qilish uchun /start buyrug'ini jo'nating")
        return
    }

    let user = await getUser(ctx)

    ctx.session.user = {
        tgid: chat_id,
        id: user.id,
        name: user.full_name,
        phone: user.phone_number,
    }

    ctx.session.step = user.adstep

    next()
})

bot.command("menu", async (ctx) => {
    let user = await getUser(ctx)

    if(!user || !user.mosque_admin){
        await ctx.reply("Siz ro'yxatdan o'tmagansiz! Ro'yhatdan o'tish uchun /start buyrug'ini jo'nating")
        return
    }

    if (!ctx.session.login) {
        await ctx.reply("Sessiyangiz eskirgan. Login qilish uchun /start buyrug'ini jo'nating")
        return
    }

    await sendMenu(ctx)
})

bot.command("logout", async ctx => {
    ctx.session.login = false
})

bot.hears("Bekor qilish", async (ctx) => {
    await ctx.reply("E'lon berish bekor qilindi", {
        parse_mode: "HTML",
        reply_markup: {
            remove_keyboard: true,
        }
    })
    ctx.session.step = "menu"
    await updateUserStep(ctx, ctx.session.step)
    await sendMenu(ctx)
})

// ROUTES

const router = new Router((ctx) => ctx.session.step)

router.route("name", async ctx => {
    await setName(ctx)
    ctx.session.step = "phone"
    await askPhone(ctx)
    await updateUserStep(ctx, ctx.session.step)
})

router.route("phone", async (ctx) => {
    let p = await setPhone(ctx)
    if (!p) return
    ctx.session.step = "username"
    await updateUserStep(ctx, ctx.session.step)
    await askUsername(ctx)
})

router.route("username", async (ctx) => {
    ctx.session.username = ctx.msg.text
    ctx.session.step = "password"
    await updateUserStep(ctx, ctx.session.step)
    await askPassword(ctx)
})

router.route("password", async (ctx) => {
    let p = await Login(ctx)
    if (!p) {
        await askUsername(ctx)
        ctx.session.step = "username"
        await updateUserStep(ctx, ctx.session.step)
        return
    }
    ctx.session.login = true
    ctx.session.step = "menu"
    await updateUserStep(ctx, ctx.session.step)
    await sendMenu(ctx)
})

router.route("menu", async (ctx) => {
    await sendMenu(ctx)
})

router.route(`edit_user_info:name`, async (ctx) => {
    let a = await setName(ctx)
    await ctx.reply(messages.nameChagedMsg(ctx.session.user.name),{
        parse_mode: "HTML",
        reply_markup: InlineKeyboards.back("menu")
    })
    ctx.session.step = "menu"
    await updateUserStep(ctx, ctx.session.step)
})

router.route(`edit_user_info:phone`, async (ctx) => {
    let a = await setPhone(ctx)
    if (!a) return
    await ctx.reply(messages.phoneChagedMsg(ctx.session.user.phone), {
        parse_mode: "HTML",
        reply_markup: InlineKeyboards.back("menu")
    })
    ctx.session.step = "menu"
    await updateUserStep(ctx, ctx.session.step)
})

// AD

router.route(`ad:name`, async (ctx) => {
    await setAdName(ctx)
    if (ctx.session.editing) {
        ctx.session.step = "ad:result"
        ctx.session.editing = false
        await sendResult(ctx)
        return
    }
    ctx.session.step = "ad:amount"
    await updateUserStep(ctx, ctx.session.step)
    await askAdAmount(ctx)
})

router.route(`ad:amount`, async (ctx) => {
    let x = await setAdAmount(ctx)
    if (!x) return
    ctx.session.step = "ad:amount_type"
    await updateUserStep(ctx, ctx.session.step)
    await askAdAmountType(ctx)
})

router.route(`ad:amount_type`, async (ctx) => {
    let x = await setAdAmountType(ctx)
    if (!x) return
    if (ctx.session.editing) {
        ctx.session.step = "ad:result"
        ctx.session.editing = false
        await sendResult(ctx)
        return
    }
    ctx.session.step = "ad:text"
    await updateUserStep(ctx, ctx.session.step)
    await askAdText(ctx, 0, "send")
})

router.route(`ad:text`, async (ctx) => {
    await setAdText(ctx)
    if (ctx.session.editing) {
        ctx.session.step = "ad:result"
        ctx.session.editing = false
        await sendResult(ctx)
        return
    }
    ctx.session.step = "ad:category"
    await updateUserStep(ctx, ctx.session.step)
    await sendCategories(ctx, 0, "send")
})

// CALLBACK

bot.on("callback_query:data", async ctx => {
    const {
        url: command,
        query
    } = require('query-string').parseUrl(ctx.callbackQuery.data)

    switch (command) {
        case "all_ads":
            await ctx.editMessageText("Kerakli bo'limni tanlang:", {
                message_id: ctx.callbackQuery.message.message_id,
                parse_mode: "HTML",
                reply_markup: InlineKeyboards.ad_sections_menu("menu")
            })
            break;
        case "all_mosques":
            await openSettingsMenu(ctx)
            break;
        case "settings":
            await openSettingsMenu(ctx)
            break;
        case "my_categories":
            await selectMosque(ctx, "remove_category")
            break;
        case "change_user_info":
            await changeCredentials(ctx)
            break;
        case "new_ad":
            await askAdName(ctx)
            ctx.session.step = "ad:name"
            await updateUserStep(ctx, ctx.session.step)
            break;
        case "parent_category":
            await sendCategories(ctx, 0, "edit", true)
            break;
        case "child_category":
            ctx.session.ad.category_id = query.category_id
            await sendResult(ctx, "edit")
            ctx.session.step = "ad:result"
            await updateUserStep(ctx, ctx.session.step)
            break;
        case "edit_ad":
            await ctx.editMessageReplyMarkup({
                message_id: ctx.callbackQuery.message.message_id,
                reply_markup: InlineKeyboards.ad_edit_menu("ad:result")
            }) 
            ctx.session.step = "ad:edit"
            ctx.session.editing = true
            await updateUserStep(ctx, ctx.session.step)
            break;
        case "cancel_ad":
            for (const key of Object.keys(ctx.session.ad)) {
                ctx.session.ad[key] = null
            }
            await ctx.api.deleteMessage(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id)
            await ctx.reply("E'lon berish bekor qilindi.",{
                parse_mode: "HTML",
                reply_markup: {
                    remove_keyboard: true,
                }
            }) 
            ctx.session.step = "menu"
            await updateUserStep(ctx, ctx.session.step)
            await sendMenu(ctx)
            break;
        case "send_ad":
            await createAd(ctx)
            await ctx.api.deleteMessage(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id)
            for (const key of Object.keys(ctx.session.ad)) {
                ctx.session.ad[key] = null
            }
            ctx.session.step = "menu"
            await updateUserStep(ctx, ctx.session.step)
            await sendMenu(ctx)
            break;
        case "ad:edit_name":
            await askAdName(ctx)
            ctx.session.step = "ad:name"
            await updateUserStep(ctx, ctx.session.step)
            break
        case "ad:edit_text":
            await ctx.editMessageText("Qo'shimcha izohni kiriting:",{
                reply_markup: {
                    inline_keyboard: []
                }
            })
            ctx.session.step = "ad:text"
            await updateUserStep(ctx, ctx.session.step)
            break
        case "ad:edit_amount":
            await ctx.editMessageText("Kerakli miqdorni kiriting:",{
                reply_markup: {
                    inline_keyboard: []
                }
            })
            ctx.session.step = "ad:amount"
            await updateUserStep(ctx, ctx.session.step)
            break;
        case "ad:edit_category":
            await sendCategories(ctx, 0, "edit")
            ctx.session.step = "ad:category"
            await updateUserStep(ctx, ctx.session.step)
            break;
        case "back":
            await backToMenu(ctx)
            break;
        case "yes":
            switch (query.step) {
                case "ad:text":
                    await ctx.editMessageText("Qo'shimcha izohni kiriting:", {
                        message_id: ctx.callbackQuery.message.message_id,
                        reply_markup: {
                            inline_keyboard: []
                        }
                    })
                    await ctx.answerCallbackQuery()
                    break;
                default:
                    await ctx.answerCallbackQuery()
                    break;
            }
            break;
        case "no":
            switch (query.step) {
                case "ad:text":
                    ctx.session.step = "ad:category"
                    await updateUserStep(ctx, ctx.session.step)
                    await sendCategories(ctx, 0, "edit")
                    await ctx.answerCallbackQuery()
                    break;
                default:
                    await ctx.answerCallbackQuery()
                    break;
            }
        default:
            await ctx.answerCallbackQuery()
            break;
    }
})

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
});


bot.use(router)
bot.start()
