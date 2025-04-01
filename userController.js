const { showMainMenu, showSubscriptionMenu } = require('../services/telegramService');
const { getUser, saveUser, getUserByRefCode } = require('../database/db');

async function handleStart(ctx) {
  const userId = ctx.from.id;
  let user = getUser(userId);

  if (!user) {
    user = {
      id: userId,
      username: ctx.from.username || '',
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name || '',
      subscribed: false,
      stars: 0,
      referralCode: `ref_${userId}_${Math.random().toString(36).substr(2, 5)}`,
      invitedBy: null,
      invitedUsers: [],
      paidReferrals: 0,
      level: 0,
      joinDate: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    // Обработка реферальной ссылки
    const startPayload = ctx.startPayload;
    if (startPayload && startPayload.startsWith('ref_')) {
      user.invitedBy = startPayload;
      const referrer = getUserByRefCode(startPayload);
      
      if (referrer) {
        referrer.invitedUsers.push(userId);
        saveUser(referrer);
        
        try {
          await ctx.telegram.sendMessage(
            referrer.id,
            `🎉 Новый реферал! @${ctx.from.username || userId} присоединился по вашей ссылке!`
          );
        } catch (e) {
          console.error('Error sending notification:', e);
        }
      }
    }

    saveUser(user);
  }

  // Проверка доступа (только оплатившие или пригласившие 3 оплативших)
  const hasAccess = user.subscribed || user.paidReferrals >= 3;
  if (!hasAccess) {
    await showSubscriptionMenu(ctx, user);
  } else {
    await showMainMenu(ctx, user);
  }
}

async function handleInviteFriends(ctx) {
  const user = getUser(ctx.from.id);
  await ctx.editMessageText(`
<b>👥 Пригласите друзей</b>

Пригласите 3 друзей, которые оплатят подписку, и получите бесплатный доступ к боту!

Ваша реферальная ссылка:
https://t.me/pro100starsbot?start=${user.referralCode}

Приглашено друзей: ${user.invitedUsers.length}
Из них оплатили: ${user.paidReferrals}/3

За каждого оплатившего друга вы получаете 50 Stars!
  `, {
    reply_markup: {
      inline_keyboard: [
        [{
          text: "📤 Поделиться ссылкой",
          switch_inline_query: `Присоединяйся к pro100stars! Получи бонус за регистрацию: https://t.me/pro100starsbot?start=${user.referralCode}`
        }],
        [{
          text: "🔙 Назад",
          callback_data: "back_to_subscribe"
        }]
      ]
    },
    parse_mode: 'HTML'
  });
}

module.exports = {
  handleStart,
  handleInviteFriends
};