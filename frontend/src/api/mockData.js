// Mock fallback data for when FastAPI backend is offline or Demo Mode is enabled

let mockTransactions = [
  {
    id: 1,
    user_id: 15,
    amount: 150000,
    category: 'Salary',
    description: 'Monthly Salary',
    date: '2026-10-01',
    type: 'income',
  },
  {
    id: 2,
    user_id: 15,
    amount: 25000,
    category: 'Food',
    description: 'Supermarket Groceries',
    date: '2026-10-02',
    type: 'expense',
  },
  {
    id: 3,
    user_id: 15,
    amount: 12000,
    category: 'Transport',
    description: 'Fuel & Taxi',
    date: '2026-10-03',
    type: 'expense',
  },
  {
    id: 4,
    user_id: 15,
    amount: 18000,
    category: 'Entertainment',
    description: 'Concert tickets & dinner',
    date: '2026-10-04',
    type: 'expense',
  },
  {
    id: 5,
    user_id: 15,
    amount: 35000,
    category: 'Shopping',
    description: 'Winter Jacket',
    date: '2026-10-05',
    type: 'expense',
  },
  {
    id: 6,
    user_id: 15,
    amount: 45000,
    category: 'Freelance',
    description: 'Web Design Project',
    date: '2026-10-05',
    type: 'income',
  },
];

let mockBudgets = [
  { category: 'Food', limit: 40000, spent: 25000 },
  { category: 'Transport', limit: 20000, spent: 12000 },
  { category: 'Entertainment', limit: 15000, spent: 18000 },
  { category: 'Shopping', limit: 50000, spent: 35000 },
  { category: 'Bills', limit: 30000, spent: 22000 },
];

export const getMockDashboard = (userId, period) => {
  const income = mockTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = mockTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = 245000 + income - expenses;

  return {
    user_id: Number(userId),
    period: period || '2026-10',
    balance: balance,
    total_income: income,
    total_expenses: expenses,
    categories_breakdown: {
      Food: 25000,
      Transport: 12000,
      Entertainment: 18000,
      Shopping: 35000,
      Bills: 22000,
    },
    recent_transactions: [...mockTransactions].reverse().slice(0, 5),
    insight:
      '💡 You spent 27% more on Entertainment this month, exceeding your limit. However, your total savings remain positive (+₸105,000).',
    forecast_summary:
      '📈 Projected end-of-month balance is ₸315,000 based on your current spending rate and anticipated income.',
  };
};

export const getMockTransactions = (userId, period) => {
  return [...mockTransactions].reverse();
};

export const addMockTransaction = (data) => {
  const newTx = {
    id: Date.now(),
    user_id: Number(data.user_id),
    amount: Number(data.amount),
    category: data.category || 'Other',
    description: data.description || '',
    date: data.date || new Date().toISOString().split('T')[0],
    type: data.type || 'expense',
  };
  mockTransactions.push(newTx);
  return newTx;
};

export const deleteMockTransaction = (id) => {
  mockTransactions = mockTransactions.filter((t) => t.id !== Number(id));
  return { success: true, message: 'Transaction deleted' };
};

export const getMockBudget = (userId, period) => {
  return {
    user_id: Number(userId),
    period: period || '2026-10',
    budgets: [...mockBudgets],
  };
};

export const setMockBudget = (data) => {
  const existing = mockBudgets.find((b) => b.category.toLowerCase() === data.category.toLowerCase());
  if (existing) {
    existing.limit = Number(data.amount || data.limit);
  } else {
    mockBudgets.push({
      category: data.category,
      limit: Number(data.amount || data.limit),
      spent: 0,
    });
  }
  return { success: true, message: 'Budget updated', budgets: mockBudgets };
};

export const getMockInsights = (userId, period) => {
  return {
    user_id: Number(userId),
    period: period || '2026-10',
    insights: [
      {
        id: 1,
        type: 'warning',
        severity: 'high',
        title: 'Entertainment budget exceeded',
        message: 'You have spent ₸18,000 out of your ₸15,000 budget (120%).',
        recommendation: 'Consider cutting discretionary spending for the remaining 3 weeks.',
      },
      {
        id: 2,
        type: 'negative',
        severity: 'medium',
        title: 'Food spending increased',
        message: 'You spent 27% more on supermarket dining compared to last month.',
        recommendation: 'Meal prepping could save up to ₸15,000 monthly.',
      },
      {
        id: 3,
        type: 'success',
        severity: 'low',
        title: 'Transportation spending decreased',
        message: 'Great job! Your transportation costs dropped by 18% (₸12,000 vs ₸14,600 avg).',
        recommendation: 'Keep maintaining your current commute habits.',
      },
      {
        id: 4,
        type: 'info',
        severity: 'low',
        title: 'Healthy Savings Rate',
        message: 'Your current savings rate is 32% of total income, well above the 20% benchmark.',
        recommendation: 'Allocate the surplus to your emergency fund or investments.',
      },
    ],
  };
};

export const getMockForecast = (userId, period) => {
  return {
    user_id: Number(userId),
    period: period || '2026-10',
    current_balance: 245000,
    predicted_balance: 315000,
    predicted_income: 195000,
    predicted_expenses: 125000,
    summary:
      'Based on predictive modeling of your recurring expenses and daily variance, your net cash flow will remain positive throughout October 2026.',
    warnings: [
      'Discretionary expenses are tracking 15% faster than average this week.',
      'Upcoming utility bills estimated at ₸25,000 expected in 10 days.',
    ],
    forecast_data: [
      { month: 'Jun', balance: 180000, expenses: 95000, income: 150000 },
      { month: 'Jul', balance: 205000, expenses: 105000, income: 155000 },
      { month: 'Aug', balance: 220000, expenses: 110000, income: 160000 },
      { month: 'Sep', balance: 235000, expenses: 98000, income: 150000 },
      { month: 'Oct (Current)', balance: 245000, expenses: 112000, income: 195000 },
      { month: 'Nov (Forecast)', balance: 285000, expenses: 118000, income: 195000 },
      { month: 'Dec (Forecast)', balance: 315000, expenses: 125000, income: 200000 },
    ],
  };
};

export const getMockSimulation = (data) => {
  const price = Number(data.price);
  const currentBalance = 245000;
  const balanceAfter = currentBalance - price;
  const canAfford = balanceAfter >= 50000;
  const isRisky = balanceAfter > 0 && balanceAfter < 50000;

  return {
    item_name: data.item_name || 'Item',
    price: price,
    can_afford: canAfford,
    verdict: canAfford ? 'affordable' : isRisky ? 'risky' : 'unaffordable',
    balance_before: currentBalance,
    balance_after: balanceAfter,
    budget_impact: `This purchase represents ${Math.round((price / currentBalance) * 100)}% of your available liquidity.`,
    recommendation: canAfford
      ? `You can safely purchase ${data.item_name}. It maintains a safe liquidity cushion of ${balanceAfter.toLocaleString()} ₸.`
      : isRisky
      ? `Purchasing this now drops your safety reserve below recommended 50,000 ₸. Consider waiting 1-2 pay cycles.`
      : `Not recommended. This purchase would exceed your current cash reserves by ${Math.abs(balanceAfter).toLocaleString()} ₸.`,
    warning: balanceAfter < 30000 ? 'Liquidity alert: Emergency reserve severely depleted.' : null,
  };
};

export const getMockChatReply = (message) => {
  const text = message.toLowerCase();
  if (text.includes('laptop') || text.includes('macbook') || text.includes('400')) {
    return 'Based on your current balance of ₸245,000 and monthly savings of ~₸70,000, buying a ₸400,000 laptop immediately would deplete your cash cushion. I recommend setting aside ₸80,000 over the next 2 months or opting for a 0% installment plan.';
  } else if (text.includes('budget') || text.includes('food') || text.includes('spend')) {
    return 'Your highest spending category this month is Food (₸25,000, 62% of budget) and Entertainment (₸18,000, 120% of limit - currently exceeded). Reducing dining out could save you approximately ₸15,000 this month.';
  } else if (text.includes('balance') || text.includes('how much')) {
    return 'Your current balance is ₸245,000. Total income recorded for October 2026 is ₸195,000 and total expenses are ₸112,000, giving you a positive net flow of +₸83,000.';
  }
  return `Analyzing your finances: Your monthly cash flow is healthy with a 32% savings rate. You have strong liquidity, but keep an eye on Entertainment spending which exceeded the set threshold. Is there a specific purchase or category you'd like advice on?`;
};
