const {
    Bot,
    session,
    GrammyError,
    BotError,
    HttpError
} = require("grammy");
const configs = require("./src/config");
const { askName, askPhone, setName, updateUserStep, sendMenu, setPhone, selectMosque, setCategory, openSettingsMenu, backToMenu, getUser, s, selectMosqueendAlert, sendAlert, setMosque, changeCredentials, Login, askUsername, askPassword } = require("./src/controllers/controllers");
const { Router } = require("@grammyjs/router");
const messages = require("./src/assets/messages");
const InlineKeyboards = require("./src/assets/inline_keyboard");
const fetchUrl = require("./src/modules/fetch_url");


const bot = new Bot(configs.TG_TOKEN)

bot.use(session({
    initial: () => ({
        step: "idle",
        user: {
            id: null,
            tgid: null,
            name: null,
            phone: null,
        },
        messages_to_delete: []
    })
}))

bot.api.setMyCommands([{
    command: "start",
    description: "Start the bot"
}
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

    if (ctx.session.step == "menu") {
        await sendMenu(ctx)
    }
})

bot.on("message", async (ctx, next) => {
    const chat_id = ctx.msg.chat.id

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

    await sendMenu(ctx)
})

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
    ctx.session.user.username = ctx.msg.text
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
    ctx.session.step = "password"
    await updateUserStep(ctx, ctx.session.step)
    await askPassword(ctx)
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
        case "back":
            await backToMenu(ctx)
            break;
    
        default:
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
