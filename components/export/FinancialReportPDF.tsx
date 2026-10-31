// components/export/FinancialReportPDF.tsx

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatZAR } from '@/lib/utils'

const colors = {
  ink: '#172B1F',
  green: '#2D6A4F',
  lightGreen: '#E8F3EC',
  muted: '#66736B',
  border: '#DCE5DF',
  soft: '#F6F8F7',
  income: '#16794A',
  expense: '#B42318',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 42,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    color: colors.ink,
  },
  header: {
    borderBottomWidth: 3,
    borderBottomColor: colors.green,
    paddingBottom: 14,
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.green,
    letterSpacing: 1.2,
  },
  statementLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'right',
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: colors.ink,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 5,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
  },
  metadataItem: {
    width: '50%',
    marginBottom: 7,
  },
  metadataLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  metadataValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.ink,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 7,
  },
  summaryTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    backgroundColor: colors.green,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  summaryHeaderText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryTotalRow: {
    backgroundColor: colors.lightGreen,
    borderBottomWidth: 0,
  },
  monthColumn: {
    width: '26%',
  },
  amountColumn: {
    width: '19%',
    textAlign: 'right',
  },
  transactionColumn: {
    width: '17%',
    textAlign: 'right',
  },
  tableText: {
    fontSize: 8,
    color: colors.ink,
  },
  tableMuted: {
    fontSize: 8,
    color: colors.muted,
  },
  tableAmount: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  metricGrid: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  metricCard: {
    width: '24%',
    marginRight: '1.33%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 9,
  },
  lastMetricCard: {
    marginRight: 0,
  },
  metricLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  monthSection: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.soft,
    paddingVertical: 8,
    paddingHorizontal: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.ink,
  },
  monthNet: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  detailHeader: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EF',
  },
  detailDate: {
    width: '15%',
    fontSize: 7,
    color: colors.muted,
  },
  detailDescription: {
    width: '42%',
    paddingRight: 6,
    fontSize: 8,
    color: colors.ink,
  },
  detailType: {
    width: '18%',
    fontSize: 7,
    textTransform: 'uppercase',
  },
  detailAmount: {
    width: '25%',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  detailMeta: {
    fontSize: 7,
    color: colors.muted,
    marginTop: 2,
  },
  monthFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: colors.soft,
  },
  monthFooterText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.ink,
  },
  emptyText: {
    fontSize: 8,
    color: colors.muted,
    fontStyle: 'italic',
    padding: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 42,
    right: 42,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#89958D',
  },
})

interface ReportTransaction {
  description: string | null
  category: string | null
  amount: number
  date: string
  type?: 'income' | 'expense'
  buyer_name?: string | null
  farm_name?: string | null
}

interface ReportData {
  startDate: string
  endDate: string
  income: ReportTransaction[]
  expenses: ReportTransaction[]
  totalIncome: number
  totalExpenses: number
  net: number
  isProfit: boolean
  profitMargin: string
  farmName: string
}

type MonthlyStatement = {
  key: string
  label: string
  income: number
  expenses: number
  transactions: ReportTransaction[]
}

export function FinancialReportPDF({ data }: { data: ReportData }) {
  const formatDate = (dateStr: string) => new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const formatMonth = (monthKey: string) => new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
  })

  const formatGeneratedAt = () => new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const truncateText = (text: string, maxLength = 42) =>
    text.length > maxLength ? `${text.substring(0, maxLength)}...` : text

  const allTransactions = [...data.income, ...data.expenses].map((transaction) => ({
    ...transaction,
    type: transaction.type || (data.income.includes(transaction) ? 'income' : 'expense'),
  }))

  const startMonth = data.startDate.slice(0, 7)
  const endMonth = data.endDate.slice(0, 7)
  const monthlyStatements: MonthlyStatement[] = []
  const cursor = new Date(`${startMonth}-01T00:00:00`)
  const lastMonth = new Date(`${endMonth}-01T00:00:00`)

  while (cursor <= lastMonth) {
    const key = cursor.toISOString().slice(0, 7)
    const transactions = allTransactions
      .filter((transaction) => transaction.date.slice(0, 7) === key)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    monthlyStatements.push({
      key,
      label: formatMonth(key),
      income: transactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0),
      expenses: transactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0),
      transactions,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const renderFooter = () => (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>RootBase | Confidential financial statement</Text>
      <Text style={styles.footerText}>Page <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} /></Text>
    </View>
  )

  return (
    <Document title={`RootBase Financial Statement - ${data.farmName}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>ROOTBASE</Text>
            <Text style={styles.statementLabel}>Financial activity statement</Text>
          </View>
          <Text style={styles.title}>Financial Report</Text>
          <Text style={styles.subtitle}>A clear record of income, expenses and net result for the selected reporting period.</Text>
        </View>

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Statement scope</Text>
            <Text style={styles.metadataValue}>{data.farmName}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Reporting period</Text>
            <Text style={styles.metadataValue}>{formatDate(data.startDate)} - {formatDate(data.endDate)}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Prepared on</Text>
            <Text style={styles.metadataValue}>{formatGeneratedAt()}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Activity recorded</Text>
            <Text style={styles.metadataValue}>{allTransactions.length} transactions</Text>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total income</Text>
            <Text style={[styles.metricValue, { color: colors.income }]}>{formatZAR(data.totalIncome)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total expenses</Text>
            <Text style={[styles.metricValue, { color: colors.expense }]}>{formatZAR(data.totalExpenses)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{data.isProfit ? 'Net profit' : 'Net loss'}</Text>
            <Text style={[styles.metricValue, { color: data.isProfit ? colors.income : colors.expense }]}>
              {data.isProfit ? '+' : '-'}{formatZAR(Math.abs(data.net))}
            </Text>
          </View>
          <View style={[styles.metricCard, styles.lastMetricCard]}>
            <Text style={styles.metricLabel}>Profit margin</Text>
            <Text style={[styles.metricValue, { color: data.isProfit ? colors.income : colors.expense }]}>{data.profitMargin}%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly summary</Text>
          <View style={styles.summaryTable}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryHeaderText, styles.monthColumn]}>Period</Text>
              <Text style={[styles.summaryHeaderText, styles.amountColumn]}>Income</Text>
              <Text style={[styles.summaryHeaderText, styles.amountColumn]}>Expenses</Text>
              <Text style={[styles.summaryHeaderText, styles.amountColumn]}>Net result</Text>
              <Text style={[styles.summaryHeaderText, styles.transactionColumn]}>Entries</Text>
            </View>
            {monthlyStatements.map((month) => {
              const net = month.income - month.expenses
              return (
                <View key={month.key} style={styles.summaryRow}>
                  <Text style={[styles.tableText, styles.monthColumn]}>{month.label}</Text>
                  <Text style={[styles.tableAmount, styles.amountColumn, { color: colors.income }]}>{formatZAR(month.income)}</Text>
                  <Text style={[styles.tableAmount, styles.amountColumn, { color: colors.expense }]}>{formatZAR(month.expenses)}</Text>
                  <Text style={[styles.tableAmount, styles.amountColumn, { color: net >= 0 ? colors.income : colors.expense }]}>
                    {net >= 0 ? '+' : '-'}{formatZAR(Math.abs(net))}
                  </Text>
                  <Text style={[styles.tableMuted, styles.transactionColumn]}>{month.transactions.length}</Text>
                </View>
              )
            })}
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={[styles.tableText, styles.monthColumn, { fontWeight: 'bold' }]}>Total for period</Text>
              <Text style={[styles.tableAmount, styles.amountColumn, { color: colors.income }]}>{formatZAR(data.totalIncome)}</Text>
              <Text style={[styles.tableAmount, styles.amountColumn, { color: colors.expense }]}>{formatZAR(data.totalExpenses)}</Text>
              <Text style={[styles.tableAmount, styles.amountColumn, { color: data.net >= 0 ? colors.income : colors.expense }]}>
                {data.net >= 0 ? '+' : '-'}{formatZAR(Math.abs(data.net))}
              </Text>
              <Text style={[styles.tableMuted, styles.transactionColumn]}>{allTransactions.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction detail by month</Text>
          {monthlyStatements.map((month) => {
            const net = month.income - month.expenses
            return (
              <View key={month.key} style={styles.monthSection}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthTitle}>{month.label}</Text>
                  <Text style={[styles.monthNet, { color: net >= 0 ? colors.income : colors.expense }]}>
                    Net {net >= 0 ? '+' : '-'}{formatZAR(Math.abs(net))}
                  </Text>
                </View>
                {month.transactions.length === 0 ? (
                  <Text style={styles.emptyText}>No activity recorded in this month.</Text>
                ) : (
                  <>
                    <View style={styles.detailHeader}>
                      <Text style={[styles.tableMuted, styles.detailDate]}>Date</Text>
                      <Text style={[styles.tableMuted, styles.detailDescription]}>Description / category</Text>
                      <Text style={[styles.tableMuted, styles.detailType]}>Type</Text>
                      <Text style={[styles.tableMuted, styles.detailAmount]}>Amount</Text>
                    </View>
                    {month.transactions.map((transaction, index) => (
                      <View key={`${month.key}-${index}`} style={styles.detailRow}>
                        <Text style={styles.detailDate}>{formatDate(transaction.date)}</Text>
                        <View style={styles.detailDescription}>
                          <Text>{truncateText(transaction.description || 'Unnamed transaction')}</Text>
                          <Text style={styles.detailMeta}>
                            {[transaction.category, transaction.farm_name].filter(Boolean).join(' | ') || 'Uncategorised'}
                          </Text>
                        </View>
                        <Text style={[styles.detailType, { color: transaction.type === 'income' ? colors.income : colors.expense }]}>
                          {transaction.type === 'income' ? 'Credit' : 'Debit'}
                        </Text>
                        <Text style={[styles.detailAmount, { color: transaction.type === 'income' ? colors.income : colors.expense }]}>
                          {transaction.type === 'income' ? '+' : '-'}{formatZAR(transaction.amount)}
                        </Text>
                      </View>
                    ))}
                    <View style={styles.monthFooter}>
                      <Text style={styles.monthFooterText}>Income {formatZAR(month.income)} | Expenses {formatZAR(month.expenses)}</Text>
                      <Text style={styles.monthFooterText}>Net {net >= 0 ? '+' : '-'}{formatZAR(Math.abs(net))}</Text>
                    </View>
                  </>
                )}
              </View>
            )
          })}
        </View>

        {renderFooter()}
      </Page>
    </Document>
  )
}
