const {
    Bot,
    session,
    GrammyError,
    BotError,
    HttpError
} = require("grammy");
const configs = require("./src/config");
const { askName, askPhone, setName, updateUserStep, sendMenu, setPhone, selectMosque, setCategory, openSettingsMenu, backToMenu, getUser, s, selectMosqueendAlert, sendAlert } = require("./src/controllers/controllers");
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

console.log(configs.TG_TOKEN)
bot.command("start", async (ctx, next) => {
    const chat_id = ctx.msg.chat.id
    
    let user = await getUser(ctx)
    
    if(user && (user.role != 2 || user.role != 1)){
        await sendAlert(ctx, "Siz bu botdan foydalana olmaysiz")
        return
    }
    
    if(user && (user["mosque_admin.verified"] == false)){
        await sendAlert(ctx, "Siz hali tasdiqlanmagansiz")
        return
    }
    
    if (!user) {
        console.log(chat_id);
        let body = {
            telegram_id: chat_id,
            role: 2,
            step: "name"
        }
        user = await fetchUrl(`/users`, "POST", body)
        user = user?.data.user

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

    ctx.session.step = user.step
})

bot.on("message", async (ctx, next) => {
    const chat_id = ctx.msg.chat.id

    let user = await getUser(ctx)

    if(user && (user.role != 2)){
        await sendAlert(ctx, "Siz bu botdan foydalana olmaysiz")
        return
    }
    
    if(ctx.session.step == "verification"){
        if(user && (!user["mosque_admin.verified"])){
            await sendAlert(ctx, "Siz hali tasdiqlanmagansiz")
            return
        }
    }

    ctx.session.user = {
        tgid: chat_id,
        id: user.id,
        name: user.full_name,
        phone: user.phone_number,
    }

    ctx.session.step = user.step
    next()
})

bot.command("menu", async (ctx) => {
    let user = await getUser(ctx)

    if(!user){
        await ctx.reply("Siz ro'yxatdan o'tmagansiz! Ro'yhatdan o'tish uchun /start buyrug'ini jo'nating")
        return
    }
    await sendMenu(ctx)
})

const router = new Router(ctx => ctx.session.step)

router.route("name", async ctx => {
    await setName(ctx)
    ctx.session.step = "phone"
    await askPhone(ctx)
    await updateUserStep(ctx, ctx.session.step)
})

router.route("phone", async (ctx) => {
    let p = await setPhone(ctx)
    if (!p) return
    ctx.session.step = "select_mosque"
    await updateUserStep(ctx, ctx.session.step)
    await selectMosque(ctx)
})

router.route("select_mosque", async (ctx) => {
    await selectMosque(ctx, "select_category")
})
router.route("menu", async (ctx) => {
    await sendMenu(ctx)
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
