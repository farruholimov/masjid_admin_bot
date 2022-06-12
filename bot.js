const {
    Bot,
    session,
    GrammyError,
    BotError,
    HttpError
} = require("grammy");
const configs = require("./src/config");
const { askName, askPhone, setName, updateUserStep, sendMenu, setPhone, selectCategory, setCategory, openSettingsMenu, backToMenu, getUser } = require("./src/controllers/controllers");
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

// bot.api.setMyCommands([{
//     command: "start",
//     description: "Start the bot"
// }
// ]);

bot.command("start", async (ctx, next) => {
    const chat_id = ctx.msg.chat.id
    console.log(chat_id);

    let user = await getUser(ctx)

    if (!user) {
        const role = chat_id === configs.ADMIN_ID ? 1 : 3
        let body = {
            telegram_id: chat_id,
            role: role,
            step: "name"
        }
        user = await fetchUrl(`/users`, "POST", body)
        user = user?.data.user

        ctx.session.user.tgid = chat_id
        ctx.session.user.id = user.id
        ctx.session.step = "name"
        await askName(ctx)
        return
    } else if (user) {
        if (!user.full_name) {
            ctx.session.step = "name"
            await askName(ctx)
            await updateUserStep(ctx, ctx.session.step)
            return
        }
        if (!user.phone_number) {
            ctx.session.step = "phone"
            await askPhone(ctx)
            await updateUserStep(ctx, ctx.session.step)
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
    if (user.step == "menu") {
        await sendMenu(ctx)
    }
    else if (user.step == "category") {
        await selectCategory(ctx, "select_category")
    }
})

bot.on("message", async (ctx, next) => {
    const chat_id = ctx.msg.chat.id

    let user = await getUser(ctx)

    if (!user) {
        await ctx.reply("Siz ro'yxatdan o'tmagansiz! Ro'yhatdan o'tish uchun /start buyrug'ini jo'nating")
        return
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

// bot.hears("Tugatish", async (ctx) => {
//     switch (ctx.session.step) {
//         case "verify":
//             await continueOrderProccess(ctx)
//             ctx.session.step = "order"
//             await updateUserStep(ctx, ctx.session.step)
//             break;
//         default:
//             break;
//     }
// })

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
    ctx.session.step = "category"
    await updateUserStep(ctx, ctx.session.step)
    await selectCategory(ctx, "select_category")
})

router.route("category", async (ctx) => {
    await selectCategory(ctx, "select_category")
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
        case "select_category":
            await setCategory(ctx, command)
            break;
        case "remove_category":
            await setCategory(ctx, command)
            break;
        case "end_category":
            await ctx.editMessageText(messages.regSuccessMsg+ "\n" + messages.menuMsg, {
                message_id: ctx.callbackQuery.message.message_id,
                parse_mode: "HTML",
                reply_markup: InlineKeyboards.menu
            })
            ctx.session.step = "menu"
            await updateUserStep(ctx, "menu")
            break;
        case "all_mosques":
            await openSettingsMenu(ctx)
            break;
        case "settings":
            await openSettingsMenu(ctx)
            break;
        case "my_categories":
            await selectCategory(ctx, "remove_category")
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