import { Transaction } from '../lib/transactionService';

interface BulkTransactionPrintViewProps {
  transactions: Transaction[];
  onClose: () => void;
}

export function BulkTransactionPrintView({ transactions, onClose }: BulkTransactionPrintViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const totals = transactions.reduce((acc, transaction) => {
    const amount = Math.abs(transaction.amount);
    if (transaction.type === 'income') {
      acc.income += amount;
    } else if (transaction.type === 'expense') {
      acc.expenses += amount;
    }
    return acc;
  }, { income: 0, expenses: 0 });

  const balance = totals.income - totals.expenses;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Print Header - Only visible when printing */}
        <div className="print-only text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transaction Report</h1>
          <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Screen Header - Hidden when printing */}
        <div className="no-print flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Transaction Report ({transactions.length} transactions)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🖨️ Print Report
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Company Header for Print */}
          <div className="print-only text-center mb-8 pb-4 border-b-2 border-gray-300">
            <h2 className="text-xl font-bold text-gray-900">Electron Finance App</h2>
            <p className="text-gray-600">Transaction Management System</p>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800">Total Income</h3>
              <p className="text-xl font-bold text-green-900">{formatCurrency(totals.income)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800">Total Expenses</h3>
              <p className="text-xl font-bold text-red-900">{formatCurrency(totals.expenses)}</p>
            </div>
            <div className={`border rounded-lg p-4 ${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className={`text-sm font-medium ${balance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>Balance</h3>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-800">Transactions</h3>
              <p className="text-xl font-bold text-gray-900">{transactions.length}</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">{transaction.title}</div>
                      {transaction.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {transaction.description}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {transaction.category || 'Uncategorized'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : transaction.type === 'expense'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">
                      <span
                        className={
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : transaction.type === 'expense'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }
                      >
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={4} className="border border-gray-300 px-4 py-2 text-right">
                    Net Total:
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(balance)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Print Footer */}
          <div className="print-only mt-8 pt-4 border-t-2 border-gray-300 text-center text-sm text-gray-600">
            <p>Report generated on {new Date().toLocaleString()}</p>
            <p>Electron Finance App - Transaction Management System</p>
          </div>
        </div>

        {/* Screen Footer - Hidden when printing */}
        <div className="no-print p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-2">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🖨️ Print Report
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { margin: 0; padding: 0; }
          .fixed { position: static !important; background: white !important; }
          .bg-black { background: transparent !important; }
          .shadow-xl { box-shadow: none !important; }
          .rounded-lg { border-radius: 0 !important; }
          @page { margin: 0.5in; size: A4 landscape; }
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
}
