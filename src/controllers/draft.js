class Draft{
        // Mosque

        static async selectMosque(ctx, action) {
        
            const response = await fetchUrl(`/mosques/tg`)
    
            console.log(response);
            let mosques = response?.data?.mosques
    
            await ctx.reply("Qaysi masjid nomidan ro'yxatdan o'tmoqchisiz?", {
                parse_mode: "HTML",
                reply_markup: {
                    resize_keyboard: true,
                    keyboard: Keyboards.select_mosque(mosques)
                },
            })
    
        }
    
        static async setMosque(ctx, action) {
    
            try {
                const user = await Controllers.getUser(ctx)
                const mosque_res = await fetchUrl(`/mosques/${ctx.msg.text}?byname=true`)
    
                if (mosque_res.message && mosque_res.message == "Not found") {
                    await ctx.reply("Bu nomdagi masjid topilmadi", {
                        parse_mode: "HTML"
                    })
                    return false
                }
                const mosque = mosque_res.data.mosque
    
                if (mosque.mosque_admin && mosque.mosque_admin.verified) {
                    await ctx.reply("Bu masjidga allaqachon admin ro'yxatdan o'tgan!", {
                        parse_mode: "HTML"
                    })
                    return false
                }
                
                await fetchUrl(`/users/mosque-admin`, "POST", {mosque_id: mosque.id, user_id: user.id})
    
                return true
            } catch (error) {
                console.log(error);
            }
        }

    
        static async checkExistance(ctx) {
            try {
                let user = await fetchUrl(`/users/mosque-admin/${ctx.msg.text}`)
    
                if ((user.message && user.message == "Not found") || !user.data || !user.data.ok) {
                    await ctx.reply(messages.userNotFoundMsg, {
                        parse_mode: "HTML"
                    })
                    return false
                }
    
                user = user.data.user
    
                ctx.session.user.username = user.username
                ctx.session.user.username = user.username
                
            } catch (error) {
                console.log(error);
            }
        }
    
}