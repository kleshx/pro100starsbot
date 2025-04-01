const { getUser, getAllUsers, saveUser, updateAdminBalance } = require('../database/db');

async function showAdminPanel(ctx) {
  await ctx.replyWithHTML('<b>👑 Админ-панель</b>', {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📊 Статистика", callback_data: "admin_stats" }],
        [{ text: "📩 Рассылка", callback_data: "admin_broadcast" }],
        [{ text: "👤 Управление пользователями", callback_data: "admin_users" }],
        [{ text: "💰 Управление балансом", callback_data: "admin_balance" }]
      ]
    }
  });
}

async function showAdminStats(ctx) {
  const users = getAllUsers();
  const totalUsers = users.length;
  const subscribedUsers = users.filter(u => u.subscribed).length;
  const totalStars = users.reduce((sum, u) => sum + u.stars, 0);
  const adminBalance = getAdminBalance();

  await ctx.editMessageText(`
<b>📊 Статистика бота:</b>

👤 Всего пользователей: ${totalUsers}
💎 Подписанных: ${subscribedUsers}
💰 Всего Stars в системе: ${totalStars}
🏦 Баланс админа: ${adminBalance} Stars

📅 Последние 5 регистраций:
${users.slice(-5).map(u => 
  `- @${u.username || 'нет'} (${new Date(u.joinDate).toLocaleDateString()})`
).join('\n')}
  `, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 Назад", callback_data: "admin_back" }]
      ]
    }
  });
}

async function showUserManagement(ctx) {
  const users = getAllUsers();
  
  await ctx.editMessageText(`
<b>👤 Управление пользователями</b>

Выберите пользователя для управления:
  `, {
    reply_markup: {
      inline_keyboard: [
        ...users.slice(0, 5).map(user => [{
          text: `@${user.username || user.id} (${user.stars} Stars)`,
          callback_data: `admin_user_${user.id}`
        }]),
        [{ text: "🔙 Назад", callback_data: "admin_back" }]
      ]
    },
    parse_mode: 'HTML'
  });
}

async function manageUser(ctx, userId) {
  const user = getUser(userId);
  
  await ctx.editMessageText(`
<b>👤 Управление пользователем:</b>
@${user.username || user.id}

💰 Баланс: ${user.stars} Stars
👥 Рефералов: ${user.invitedUsers.length}
💎 Подписка: ${user.subscribed ? 'Активна' : 'Не активна'}

Выберите действие:
  `, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ Добавить Stars", callback_data: `admin_add_stars_${user.id}` }],
        [{ text: "➖ Уменьшить Stars", callback_data: `admin_remove_stars_${user.id}` }],
        [{ text: "🔙 Назад", callback_data: "admin_users" }]
      ]
    },
    parse_mode: 'HTML'
  });
}

async function addStarsToUser(ctx, userId) {
  // Здесь реализация добавления Stars
}

module.exports = {
  showAdminPanel,
  showAdminStats,
  showUserManagement,
  manageUser,
  addStarsToUser
};
