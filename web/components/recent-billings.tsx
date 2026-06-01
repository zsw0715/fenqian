"use client";

const billings = [
  {
    id: 1,
    description: "Python 进阶课程 - 课时费",
    amount: 1200.00,
    date: "2026-05-28",
  },
  {
    id: 2,
    description: "React 项目辅导",
    amount: 800.00,
    date: "2026-05-27",
  },
  {
    id: 3,
    description: "算法刷题陪练",
    amount: 500.00,
    date: "2026-05-26",
  },
];

export default function RecentBillings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Recent Billings</h2>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-3 px-6 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</span>
      </div>

      {/* Table Body */}
      <ul className="divide-y divide-gray-100">
        {billings.map((billing) => (
          <li
            key={billing.id}
            className="grid grid-cols-3 items-center px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">{billing.description}</span>
            <span className="text-sm text-gray-500">{billing.date}</span>
            <span className="text-sm font-mono font-semibold text-gray-900 text-right">
              ¥{billing.amount.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
