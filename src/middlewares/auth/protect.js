export const onlyAdmin = (errorHandler) =>
  async (ctx, next) => {

    // No chat = no service
    if (!ctx.chat) {
      return
    }

    // Surely not an admin
    if (!ctx.from?.id) {
      return
    }

    const user = await users.findOne({
      where: {
        telegram_id: ctx.from.id
      },
      raw: true
    })

    if(user.role == 2){
      return next()
    }

    // Not an admin
    return errorHandler?.(ctx)
  }